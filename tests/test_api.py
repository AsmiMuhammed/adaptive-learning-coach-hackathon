"""
test_api.py - Integration tests for Flask REST API endpoints.
Tests authentication, role-based security, quiz evaluation,
mentor access control, and persistence.
"""

import pytest
import json
from backend.app import create_app
from backend.models import db, User, Learner, Question, QuizAttempt, LearningDecision


@pytest.fixture
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET": "test-secret-key-123",
    })
    with app.app_context():
        db.create_all()
        from backend.seed import seed_database
        seed_database()
        yield app


@pytest.fixture
def client(app):
    return app.test_client()


def login_helper(client, email, password="password123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res


def test_auth_login_student(client):
    """Test student login with valid credentials."""
    res = login_helper(client, "student1@demo.com")
    assert res.status_code == 200
    data = res.get_json()
    assert "token" in data
    assert data["user"]["role"] == "student"
    assert data["learner"]["email"] == "student1@demo.com"


def test_auth_login_invalid_password(client):
    """Test login rejection on wrong password."""
    res = login_helper(client, "student1@demo.com", "wrongpassword")
    assert res.status_code == 401
    assert "Invalid email or password" in res.get_json()["error"]


def test_role_enforcement_student_blocked_from_mentor(client):
    """Student cannot access mentor endpoints (HTTP 403)."""
    res = login_helper(client, "student1@demo.com")
    token = res.get_json()["token"]

    # Attempt to access mentor overview with student token
    mentor_res = client.get(
        "/api/mentor/overview",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert mentor_res.status_code == 403
    assert "Access denied" in mentor_res.get_json()["error"]


def test_mentor_overview_metrics(client):
    """Mentor can access overview with dynamic database metrics."""
    res = login_helper(client, "mentor@demo.com")
    token = res.get_json()["token"]

    overview_res = client.get(
        "/api/mentor/overview",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert overview_res.status_code == 200
    data = overview_res.get_json()
    assert data["total_students"] >= 8
    assert data["students_requiring_mentor"] >= 1
    assert data["students_recommended_reinforce"] >= 1


def test_quiz_questions_hide_correct_answers(client):
    """Quiz questions must never expose correct answers in the response."""
    res = login_helper(client, "student1@demo.com")
    token = res.get_json()["token"]

    q_res = client.get(
        "/api/quiz/questions",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert q_res.status_code == 200
    data = q_res.get_json()
    assert len(data["questions"]) >= 5
    for q in data["questions"]:
        assert "correct_answer" not in q
        assert "explanation" not in q
        assert "options" in q
        assert len(q["options"]) == 4


def test_quiz_submit_reinforce_action(client):
    """Submitting deliberately incorrect answers triggers REINFORCE and persists."""
    res = login_helper(client, "student1@demo.com")
    token = res.get_json()["token"]

    # Fetch questions
    q_res = client.get("/api/quiz/questions", headers={"Authorization": f"Bearer {token}"})
    questions = q_res.get_json()["questions"]

    # Submit deliberate wrong answers
    answers = {str(q["id"]): "totally_wrong_answer_xyz" for q in questions}

    submit_res = client.post(
        "/api/quiz/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert submit_res.status_code == 201
    result = submit_res.get_json()
    assert result["score"] == 0.0
    assert result["decision"]["action"] in ["REINFORCE", "MENTOR"]
    assert len(result["decision"]["reasons"]) > 0


def test_mentor_mark_reviewed_and_intervention(client):
    """Mentor can review a student and record an intervention note."""
    res = login_helper(client, "mentor@demo.com")
    token = res.get_json()["token"]

    # Mark learner 1 as reviewed
    review_res = client.post(
        "/api/mentor/students/1/review",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert review_res.status_code == 200

    # Add intervention
    inv_res = client.post(
        "/api/mentor/interventions",
        json={
            "learner_id": 1,
            "note": "Discussed time management and loop comprehension drills.",
            "status": "completed",
            "outcome": "Learner understood while-loop boundary cases.",
            "action_type": "Office Hours",
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert inv_res.status_code == 201
    assert inv_res.get_json()["intervention"]["status"] == "completed"
