"""
quiz_routes.py - Quiz question retrieval, submission, evaluation, and adaptive decision persistence.
"""

from datetime import datetime, timezone
import json
import random
from flask import Blueprint, request, jsonify, g
from backend.models import db, Question, Learner, QuizAttempt, LearningDecision
from backend.auth import token_required, role_required
from decision_engine.decision_engine import AdaptiveDecisionEngine

quiz_bp = Blueprint("quiz", __name__, url_prefix="/api/quiz")
engine = AdaptiveDecisionEngine()


@quiz_bp.route("/questions", methods=["GET"])
@role_required("student")
def get_quiz_questions():
    """
    Returns 5 multiple choice questions for the student quiz.
    CRITICAL: Does NOT expose correct answers or explanations in response!
    """
    # Fetch questions from database
    questions = Question.query.all()
    if not questions:
        return jsonify({"error": "No questions available in question bank"}), 500

    # If more than 5 questions, select a representative mix across topics
    # To keep testing deterministic if requested, or sample 5
    if len(questions) > 5:
        # Pick 5 distinct questions covering different topics if possible
        by_topic = {}
        for q in questions:
            by_topic.setdefault(q.topic, []).append(q)

        selected = []
        for topic_qs in by_topic.values():
            if len(selected) < 5:
                selected.append(topic_qs[0])

        # Fill remaining if needed
        for q in questions:
            if len(selected) < 5 and q not in selected:
                selected.append(q)
    else:
        selected = questions

    # Format without correct answers
    formatted = [q.to_dict(include_correct=False) for q in selected]
    return jsonify({
        "total": len(formatted),
        "questions": formatted,
    }), 200


@quiz_bp.route("/submit", methods=["POST"])
@role_required("student")
def submit_quiz():
    """
    Submits student quiz answers, grades them, invokes Adaptive Decision Engine,
    persists assessment & decision records, and updates learner progress.
    """
    learner = g.current_learner
    if not learner:
        return jsonify({"error": "Learner profile not found"}), 404

    data = request.get_json(silent=True) or {}
    answers = data.get("answers")  # Expected dict: {question_id: selected_answer_string}

    if not isinstance(answers, dict) or not answers:
        return jsonify({"error": "Invalid or missing answers payload. Expected a dictionary of question_id: answer"}), 400

    question_ids = []
    for k in answers.keys():
        try:
            question_ids.append(int(k))
        except (ValueError, TypeError):
            return jsonify({"error": f"Invalid question ID format: '{k}'. Must be an integer."}), 400

    questions = Question.query.filter(Question.id.in_(question_ids)).all()
    if not questions:
        return jsonify({"error": "No valid questions found matching submitted IDs"}), 400

    if len(questions) != len(answers):
        return jsonify({"error": "One or more question IDs do not exist in the database"}), 400

    # Grade the submission
    raw_score = 0
    total_questions = len(questions)
    topic_results = {}  # {topic: {"correct": count, "total": count}}
    breakdown = []

    for q in questions:
        user_choice = answers.get(str(q.id)) or answers.get(q.id)
        is_correct = (str(user_choice).strip().lower() == str(q.correct_answer).strip().lower())
        if is_correct:
            raw_score += 1

        topic = q.topic
        if topic not in topic_results:
            topic_results[topic] = {"correct": 0, "total": 0}
        topic_results[topic]["total"] += 1
        if is_correct:
            topic_results[topic]["correct"] += 1

        breakdown.append({
            "question_id": q.id,
            "topic": q.topic,
            "question_text": q.question_text,
            "options": q.get_options_list(),
            "user_answer": user_choice,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })

    score_percentage = round((raw_score / total_questions) * 100, 1)

    # Compute topic mastery percentages
    topic_mastery = {}
    for topic, stats in topic_results.items():
        topic_mastery[topic] = round((stats["correct"] / stats["total"]) * 100, 1)

    # Gather historical data for adaptive decision engine
    previous_attempts = learner.quiz_attempts.all()
    previous_scores = [a.score for a in previous_attempts]
    failed_attempts_count = sum(1 for a in previous_attempts if a.score < 60.0)
    if score_percentage < 60.0:
        failed_attempts_count += 1

    latest_previous_decision = learner.decisions.first()

    # Invoke Adaptive Decision Engine
    decision_result = engine.evaluate(
        latest_quiz_score=score_percentage,
        previous_quiz_scores=previous_scores,
        topic_scores=topic_mastery,
        failed_attempts=failed_attempts_count,
        days_since_last_activity=learner.days_since_last_activity,
        lessons_completed=learner.lessons_completed,
        total_lessons=learner.lessons_total,
        prerequisites_completed=learner.prerequisites_completed,
        certification_completed=learner.certification_completed,
        previous_recommendation=latest_previous_decision.action if latest_previous_decision else None,
        mentor_intervention_status="pending" if learner.reviewed_by_mentor is False else "reviewed",
        current_level=learner.current_level,
    )

    now = datetime.now(timezone.utc)

    # Persist QuizAttempt
    attempt = QuizAttempt(
        learner_id=learner.id,
        timestamp=now,
        score=score_percentage,
        raw_score=raw_score,
        total_questions=total_questions,
        topic_scores=json.dumps(topic_mastery),
        answers_summary=json.dumps(breakdown),
    )
    db.session.add(attempt)
    db.session.flush()  # to obtain attempt.id

    # Persist LearningDecision
    decision = LearningDecision(
        learner_id=learner.id,
        quiz_attempt_id=attempt.id,
        timestamp=now,
        action=decision_result.action,
        reasons=json.dumps(decision_result.reasons),
        next_activity=decision_result.next_activity,
        priority=decision_result.priority,
        mastery=decision_result.mastery,
        advancement_eligible=decision_result.advancement_eligible,
        unmet_requirements=json.dumps(decision_result.unmet_requirements),
        score_trend=decision_result.score_trend,
    )
    db.session.add(decision)

    # Update Learner state
    learner.last_activity = now
    learner.days_since_last_activity = 0
    learner.streak_days = max(learner.streak_days + 1, 1)

    # If action is ADVANCE and eligible, update learner level and completed lessons
    if decision_result.action == "ADVANCE" and decision_result.advancement_eligible:
        learner.current_level = decision_result.updated_level
        if learner.lessons_completed < learner.lessons_total:
            learner.lessons_completed = min(learner.lessons_completed + 2, learner.lessons_total)
    elif decision_result.action == "REINFORCE":
        # Increment lessons completed by 1 if passed
        if score_percentage >= 60.0 and learner.lessons_completed < learner.lessons_total:
            learner.lessons_completed = min(learner.lessons_completed + 1, learner.lessons_total)

    db.session.commit()

    # Compare with previous score
    previous_score = previous_scores[-1] if previous_scores else None
    score_diff = round(score_percentage - previous_score, 1) if previous_score is not None else None

    return jsonify({
        "message": "Quiz submitted and evaluated successfully",
        "attempt_id": attempt.id,
        "score": score_percentage,
        "raw_score": raw_score,
        "total_questions": total_questions,
        "previous_score": previous_score,
        "score_diff": score_diff,
        "topic_mastery": topic_mastery,
        "breakdown": breakdown,
        "decision": decision.to_dict(),
        "learner_level": learner.current_level,
        "lessons_completed": learner.lessons_completed,
    }), 201
