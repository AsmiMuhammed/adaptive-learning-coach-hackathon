"""
models.py - SQLAlchemy database models for AdaptIQ.
"""

from datetime import datetime, timezone
import json
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def utc_now():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="student")  # 'student' or 'mentor'
    created_at = db.Column(db.DateTime, default=utc_now)

    # 1-to-1 relationship with Learner if role is student
    learner = db.relationship("Learner", backref="user", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Learner(db.Model):
    __tablename__ = "learners"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    student_id_code = db.Column(db.String(50), unique=True, nullable=False)  # e.g. "STU-2024-001"
    course = db.Column(db.String(150), default="Python Fundamentals & AI Foundations")
    current_level = db.Column(db.Integer, default=1)
    lessons_completed = db.Column(db.Integer, default=3)
    lessons_total = db.Column(db.Integer, default=10)
    last_activity = db.Column(db.DateTime, default=utc_now)
    days_since_last_activity = db.Column(db.Integer, default=0)
    prerequisites_completed = db.Column(db.Boolean, default=True)
    certification_completed = db.Column(db.Boolean, default=True)
    streak_days = db.Column(db.Integer, default=1)
    reviewed_by_mentor = db.Column(db.Boolean, default=False)

    quiz_attempts = db.relationship(
        "QuizAttempt", backref="learner", lazy="dynamic", cascade="all, delete-orphan", order_by="QuizAttempt.timestamp.desc()"
    )
    decisions = db.relationship(
        "LearningDecision", backref="learner", lazy="dynamic", cascade="all, delete-orphan", order_by="LearningDecision.timestamp.desc()"
    )
    interventions = db.relationship(
        "MentorIntervention", backref="learner", lazy="dynamic", cascade="all, delete-orphan", order_by="MentorIntervention.timestamp.desc()"
    )

    def to_dict(self, include_details=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "student_id": self.student_id_code,
            "name": self.user.name if self.user else "Unknown",
            "email": self.user.email if self.user else "",
            "course": self.course,
            "current_level": self.current_level,
            "lessons_completed": self.lessons_completed,
            "lessons_total": self.lessons_total,
            "progress_percentage": round((self.lessons_completed / max(self.lessons_total, 1)) * 100, 1),
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "days_since_last_activity": self.days_since_last_activity,
            "prerequisites_completed": self.prerequisites_completed,
            "certification_completed": self.certification_completed,
            "streak_days": self.streak_days,
            "reviewed_by_mentor": self.reviewed_by_mentor,
        }

        latest_attempt = self.quiz_attempts.first()
        latest_decision = self.decisions.first()

        data["latest_quiz_score"] = latest_attempt.score if latest_attempt else None
        data["latest_quiz_date"] = latest_attempt.timestamp.isoformat() if latest_attempt else None
        data["latest_action"] = latest_decision.action if latest_decision else "PENDING_ASSESSMENT"
        data["latest_priority"] = latest_decision.priority if latest_decision else "normal"
        data["latest_next_activity"] = (
            latest_decision.next_activity if latest_decision else "Complete initial diagnostic quiz"
        )
        data["mastery"] = latest_decision.mastery if latest_decision else (latest_attempt.score if latest_attempt else 0.0)

        # Count failed attempts (<60%)
        failed_count = sum(1 for a in self.quiz_attempts.all() if a.score < 60.0)
        data["failed_attempts_count"] = failed_count

        if include_details:
            data["quiz_history"] = [a.to_dict() for a in self.quiz_attempts.all()]
            data["decision_history"] = [d.to_dict() for d in self.decisions.all()]
            data["interventions"] = [i.to_dict() for i in self.interventions.all()]

        return data


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(80), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, nullable=False)  # JSON-encoded array of 4 options
    correct_answer = db.Column(db.String(200), nullable=False)
    difficulty = db.Column(db.String(20), default="medium")  # 'easy', 'medium', 'hard'
    explanation = db.Column(db.Text, default="")

    def get_options_list(self):
        try:
            return json.loads(self.options)
        except Exception:
            return []

    def to_dict(self, include_correct=False):
        data = {
            "id": self.id,
            "topic": self.topic,
            "question_text": self.question_text,
            "options": self.get_options_list(),
            "difficulty": self.difficulty,
        }
        if include_correct:
            data["correct_answer"] = self.correct_answer
            data["explanation"] = self.explanation
        return data


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    learner_id = db.Column(db.Integer, db.ForeignKey("learners.id"), nullable=False)
    timestamp = db.Column(db.DateTime, default=utc_now)
    score = db.Column(db.Float, nullable=False)  # percentage (e.g. 80.0)
    raw_score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    topic_scores = db.Column(db.Text, default="{}")  # JSON-encoded dict
    answers_summary = db.Column(db.Text, default="[]")  # JSON-encoded list of answer evaluations

    def get_topic_scores_dict(self):
        try:
            return json.loads(self.topic_scores)
        except Exception:
            return {}

    def get_answers_summary_list(self):
        try:
            return json.loads(self.answers_summary)
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "learner_id": self.learner_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "score": self.score,
            "raw_score": self.raw_score,
            "total_questions": self.total_questions,
            "topic_scores": self.get_topic_scores_dict(),
            "answers_summary": self.get_answers_summary_list(),
        }


class LearningDecision(db.Model):
    __tablename__ = "learning_decisions"

    id = db.Column(db.Integer, primary_key=True)
    learner_id = db.Column(db.Integer, db.ForeignKey("learners.id"), nullable=False)
    quiz_attempt_id = db.Column(db.Integer, db.ForeignKey("quiz_attempts.id"), nullable=True)
    timestamp = db.Column(db.DateTime, default=utc_now)
    action = db.Column(db.String(50), nullable=False)  # 'REINFORCE', 'ADVANCE', 'MENTOR'
    reasons = db.Column(db.Text, nullable=False)  # JSON-encoded list
    next_activity = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default="normal")  # 'normal', 'medium', 'high'
    mastery = db.Column(db.Float, default=0.0)
    advancement_eligible = db.Column(db.Boolean, default=False)
    unmet_requirements = db.Column(db.Text, default="[]")  # JSON-encoded list
    score_trend = db.Column(db.String(50), default="stable")

    def get_reasons_list(self):
        try:
            return json.loads(self.reasons)
        except Exception:
            return []

    def get_unmet_requirements_list(self):
        try:
            return json.loads(self.unmet_requirements)
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "learner_id": self.learner_id,
            "quiz_attempt_id": self.quiz_attempt_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "action": self.action,
            "reasons": self.get_reasons_list(),
            "next_activity": self.next_activity,
            "priority": self.priority,
            "mastery": self.mastery,
            "advancement_eligible": self.advancement_eligible,
            "unmet_requirements": self.get_unmet_requirements_list(),
            "score_trend": self.score_trend,
        }


class MentorIntervention(db.Model):
    __tablename__ = "mentor_interventions"

    id = db.Column(db.Integer, primary_key=True)
    learner_id = db.Column(db.Integer, db.ForeignKey("learners.id"), nullable=False)
    mentor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    timestamp = db.Column(db.DateTime, default=utc_now)
    note = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="pending")  # 'pending', 'in_progress', 'completed'
    outcome = db.Column(db.Text, nullable=True)
    action_type = db.Column(db.String(100), default="Mentor Check-in")

    mentor = db.relationship("User", foreign_keys=[mentor_id])

    def to_dict(self):
        return {
            "id": self.id,
            "learner_id": self.learner_id,
            "mentor_id": self.mentor_id,
            "mentor_name": self.mentor.name if self.mentor else "Assigned Mentor",
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "note": self.note,
            "status": self.status,
            "outcome": self.outcome,
            "action_type": self.action_type,
        }
