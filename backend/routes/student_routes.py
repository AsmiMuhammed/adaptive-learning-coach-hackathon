"""
student_routes.py - Endpoints for student dashboard, profile, and history.
Strictly enforced: students can only access their own records.
"""

from flask import Blueprint, jsonify, g
from backend.models import db, Learner, QuizAttempt, LearningDecision
from backend.auth import token_required, role_required

student_bp = Blueprint("student", __name__, url_prefix="/api/student")


@student_bp.route("/dashboard", methods=["GET"])
@role_required("student")
def get_dashboard():
    """
    Returns the personalized student dashboard data.
    Identity is strictly derived from the authenticated token.
    """
    learner = g.current_learner
    if not learner:
        return jsonify({"error": "Learner profile not found for this account"}), 404

    # Fetch recent attempts and decisions
    attempts = learner.quiz_attempts.limit(10).all()
    decisions = learner.decisions.limit(10).all()

    # Build chart data for score trend
    # Reverse to chronological order for charts
    history_reversed = list(reversed(attempts))
    chart_data = [
        {
            "id": a.id,
            "date": a.timestamp.strftime("%b %d, %H:%M") if a.timestamp else "N/A",
            "score": a.score,
            "raw_score": a.raw_score,
            "total": a.total_questions,
        }
        for a in history_reversed
    ]

    latest_attempt = attempts[0] if attempts else None
    latest_decision = decisions[0] if decisions else None

    # Compare with previous attempt if available
    previous_attempt = attempts[1] if len(attempts) > 1 else None
    score_change = None
    if latest_attempt and previous_attempt:
        score_change = round(latest_attempt.score - previous_attempt.score, 1)

    return jsonify({
        "profile": learner.to_dict(include_details=False),
        "latest_assessment": latest_attempt.to_dict() if latest_attempt else None,
        "latest_decision": latest_decision.to_dict() if latest_decision else None,
        "score_change": score_change,
        "chart_data": chart_data,
        "total_attempts": len(attempts),
        "recent_history": [
            {
                "id": a.id,
                "timestamp": a.timestamp.isoformat() if a.timestamp else None,
                "formatted_date": a.timestamp.strftime("%Y-%m-%d %H:%M") if a.timestamp else "N/A",
                "score": a.score,
                "raw_score": a.raw_score,
                "total_questions": a.total_questions,
                "topic_scores": a.get_topic_scores_dict(),
            }
            for a in attempts
        ],
    }), 200


@student_bp.route("/history", methods=["GET"])
@role_required("student")
def get_history():
    """Returns complete learning and assessment history for the authenticated student."""
    learner = g.current_learner
    if not learner:
        return jsonify({"error": "Learner profile not found"}), 404

    attempts = [a.to_dict() for a in learner.quiz_attempts.all()]
    decisions = [d.to_dict() for d in learner.decisions.all()]

    return jsonify({
        "learner_id": learner.id,
        "student_id": learner.student_id_code,
        "attempts": attempts,
        "decisions": decisions,
    }), 200
