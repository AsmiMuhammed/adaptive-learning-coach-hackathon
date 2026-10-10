"""
mentor_routes.py - Endpoints for mentor dashboard, student monitoring, and intervention recording.
Protected by role-based authorization (mentor only).
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.models import db, Learner, User, QuizAttempt, LearningDecision, MentorIntervention
from backend.auth import token_required, role_required

mentor_bp = Blueprint("mentor", __name__, url_prefix="/api/mentor")


@mentor_bp.route("/overview", methods=["GET"])
@role_required("mentor")
def get_overview_metrics():
    """
    Returns live summary counts computed dynamically from the SQLite database.
    """
    learners = Learner.query.all()
    total_students = len(learners)

    mentor_count = 0
    reinforce_count = 0
    advance_count = 0
    scores_list = []

    for l in learners:
        latest_decision = l.decisions.first()
        latest_attempt = l.quiz_attempts.first()

        if latest_decision:
            if latest_decision.action == "MENTOR":
                mentor_count += 1
            elif latest_decision.action == "REINFORCE":
                reinforce_count += 1
            elif latest_decision.action == "ADVANCE":
                advance_count += 1

        if latest_attempt:
            scores_list.append(latest_attempt.score)

    avg_score = round(sum(scores_list) / len(scores_list), 1) if scores_list else 0.0

    # Count pending interventions
    pending_interventions = MentorIntervention.query.filter_by(status="pending").count()

    return jsonify({
        "total_students": total_students,
        "students_requiring_mentor": mentor_count,
        "students_recommended_reinforce": reinforce_count,
        "students_ready_advance": advance_count,
        "average_latest_score": avg_score,
        "assessed_students_count": len(scores_list),
        "pending_interventions_count": pending_interventions,
    }), 200


@mentor_bp.route("/students", methods=["GET"])
@role_required("mentor")
def get_student_directory():
    """
    Returns searchable, filterable directory of learners with status and latest recommendations.
    Sorts learners needing attention near the top by default.
    """
    search_query = request.args.get("search", "").strip().lower()
    filter_status = request.args.get("filter", "all").strip().lower()
    sort_by = request.args.get("sort", "priority").strip().lower()

    learners = Learner.query.all()
    directory = []

    for l in learners:
        data = l.to_dict(include_details=False)

        # Apply search filter
        if search_query:
            matches_name = search_query in data["name"].lower()
            matches_email = search_query in data["email"].lower()
            matches_id = search_query in data["student_id"].lower()
            matches_course = search_query in data["course"].lower()
            if not (matches_name or matches_email or matches_id or matches_course):
                continue

        # Apply action/status filter
        if filter_status == "mentor" and data["latest_action"] != "MENTOR":
            continue
        elif filter_status == "reinforce" and data["latest_action"] != "REINFORCE":
            continue
        elif filter_status == "advance" and data["latest_action"] != "ADVANCE":
            continue
        elif filter_status == "inactive" and data["days_since_last_activity"] < 14:
            continue
        elif filter_status == "unreviewed" and data["reviewed_by_mentor"]:
            continue

        directory.append(data)

    # Priority ranking function for smart default sorting:
    # 1. Action == MENTOR (high priority)
    # 2. Priority == high
    # 3. Inactive > 14 days
    # 4. Action == REINFORCE
    # 5. Action == ADVANCE
    def sort_key(item):
        if sort_by == "score":
            return -(item["latest_quiz_score"] or 0)
        elif sort_by == "name":
            return item["name"].lower()
        elif sort_by == "activity":
            return -item["days_since_last_activity"]
        else:  # priority sort
            priority_score = 0
            if item["latest_action"] == "MENTOR":
                priority_score += 100
            if item["latest_priority"] == "high":
                priority_score += 50
            if not item["reviewed_by_mentor"]:
                priority_score += 20
            if item["days_since_last_activity"] >= 14:
                priority_score += 15
            if item["latest_action"] == "REINFORCE":
                priority_score += 10
            return -priority_score

    directory.sort(key=sort_key)
    return jsonify({"students": directory, "total": len(directory)}), 200


@mentor_bp.route("/students/<int:learner_id>", methods=["GET"])
@role_required("mentor")
def get_learner_details(learner_id: int):
    """
    Returns comprehensive details for an individual learner:
    profile, quiz history, score trend chart, weak/strong topics,
    all decisions, reasons, prerequisite status, and intervention records.
    """
    learner = db.session.get(Learner, learner_id)
    if not learner:
        return jsonify({"error": "Learner not found"}), 404

    # Build detailed response
    data = learner.to_dict(include_details=True)

    # Add trend chart data in chronological order
    attempts = list(reversed(learner.quiz_attempts.all()))
    data["score_chart_data"] = [
        {
            "id": a.id,
            "date": a.timestamp.strftime("%b %d, %H:%M") if a.timestamp else "N/A",
            "score": a.score,
            "raw_score": a.raw_score,
            "total": a.total_questions,
        }
        for a in attempts
    ]

    # Aggregate topic scores across all attempts
    topic_aggregates = {}
    for a in attempts:
        for t, s in a.get_topic_scores_dict().items():
            topic_aggregates.setdefault(t, []).append(s)

    topic_summary = {}
    weak_topics = []
    strong_topics = []
    for t, scores in topic_aggregates.items():
        avg = round(sum(scores) / len(scores), 1)
        topic_summary[t] = avg
        if avg < 70.0:
            weak_topics.append(t)
        elif avg >= 80.0:
            strong_topics.append(t)

    data["topic_mastery_summary"] = topic_summary
    data["weak_topics"] = weak_topics
    data["strong_topics"] = strong_topics

    # Explainable AI details for latest decision
    latest_decision = learner.decisions.first()
    if latest_decision:
        data["explainable_ai"] = {
            "action": latest_decision.action,
            "priority": latest_decision.priority,
            "reasons": latest_decision.get_reasons_list(),
            "next_activity": latest_decision.next_activity,
            "mastery": latest_decision.mastery,
            "advancement_eligible": latest_decision.advancement_eligible,
            "unmet_requirements": latest_decision.get_unmet_requirements_list(),
            "score_trend": latest_decision.score_trend,
            "key_indicators": {
                "latest_quiz_score": data["latest_quiz_score"],
                "failed_attempts": data["failed_attempts_count"],
                "days_inactive": learner.days_since_last_activity,
                "prerequisites_met": learner.prerequisites_completed,
                "certification_met": learner.certification_completed,
            },
        }
    else:
        data["explainable_ai"] = None

    return jsonify(data), 200


@mentor_bp.route("/students/<int:learner_id>/review", methods=["POST"])
@role_required("mentor")
def mark_learner_reviewed(learner_id: int):
    """Marks learner record as reviewed by mentor."""
    learner = db.session.get(Learner, learner_id)
    if not learner:
        return jsonify({"error": "Learner not found"}), 404

    learner.reviewed_by_mentor = True
    db.session.commit()

    return jsonify({
        "message": f"Learner {learner.user.name} marked as reviewed.",
        "reviewed_by_mentor": True,
    }), 200


@mentor_bp.route("/interventions", methods=["POST"])
@role_required("mentor")
def create_intervention():
    """
    Records a mentor intervention note, action outcome, or completed check-in.
    Persisted to database and reflected in learner profile.
    """
    data = request.get_json(silent=True) or {}
    learner_id = data.get("learner_id")
    note = data.get("note", "").strip()
    status = data.get("status", "pending")
    outcome = data.get("outcome", "").strip()
    action_type = data.get("action_type", "Mentor Check-in")

    if not learner_id or not note:
        return jsonify({"error": "learner_id and note are required"}), 400

    learner = db.session.get(Learner, learner_id)
    if not learner:
        return jsonify({"error": "Learner not found"}), 404

    intervention = MentorIntervention(
        learner_id=learner_id,
        mentor_id=g.current_user.id,
        timestamp=datetime.now(timezone.utc),
        note=note,
        status=status,
        outcome=outcome if outcome else None,
        action_type=action_type,
    )
    db.session.add(intervention)

    # Also automatically mark learner as reviewed
    learner.reviewed_by_mentor = True
    db.session.commit()

    return jsonify({
        "message": "Mentor intervention recorded successfully",
        "intervention": intervention.to_dict(),
    }), 201


@mentor_bp.route("/interventions/<int:intervention_id>", methods=["PATCH"])
@role_required("mentor")
def update_intervention(intervention_id: int):
    """Updates status or outcome of an existing intervention."""
    data = request.get_json(silent=True) or {}
    intervention = db.session.get(MentorIntervention, intervention_id)
    if not intervention:
        return jsonify({"error": "Intervention record not found"}), 404

    if "status" in data:
        intervention.status = data["status"]
    if "outcome" in data:
        intervention.outcome = data["outcome"]
    if "note" in data:
        intervention.note = data["note"]

    db.session.commit()
    return jsonify({
        "message": "Intervention updated",
        "intervention": intervention.to_dict(),
    }), 200


@mentor_bp.route("/follow-ups", methods=["GET"])
@role_required("mentor")
def get_follow_ups():
    """Returns list of pending and recent mentor follow-up items."""
    interventions = MentorIntervention.query.order_by(MentorIntervention.timestamp.desc()).all()
    return jsonify({
        "total": len(interventions),
        "interventions": [i.to_dict() for i in interventions],
    }), 200
