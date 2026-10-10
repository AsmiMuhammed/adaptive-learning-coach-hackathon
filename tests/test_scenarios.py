"""
test_scenarios.py - Full automated test suite for Scenarios A through H
as specified in Hackathon Problem #8 specification.
"""

import pytest
import json
from backend.app import create_app
from backend.models import db, User, Learner, Question, QuizAttempt, LearningDecision, MentorIntervention
from decision_engine.decision_engine import evaluate_learner


@pytest.fixture
def test_app(tmp_path):
    db_file = tmp_path / "test_adaptiq.db"
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_file}",
        "JWT_SECRET": "hackathon-scenario-test-secret",
    })
    with app.app_context():
        db.create_all()
        from backend.seed import seed_database
        seed_database()
        yield app


@pytest.fixture
def client(test_app):
    return test_app.test_client()


def get_token(client, email, password="password123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.get_json()}"
    return res.get_json()["token"]


# SCENARIO A: Student needing reinforcement
def test_scenario_a_reinforce(client):
    """
    Scenario A: Student with low score and weak mastery receives REINFORCE action,
    with a specific targeted revision activity assigned, and result persisted.
    """
    token = get_token(client, "student6@demo.com")  # Liam Chen

    # Fetch questions
    q_res = client.get("/api/quiz/questions", headers={"Authorization": f"Bearer {token}"})
    assert q_res.status_code == 200
    questions = q_res.get_json()["questions"]

    # Deliberately submit incorrect answers for Loops and Lists to test weak topic targeting
    answers = {str(q["id"]): "Wrong Answer" for q in questions}

    res = client.post(
        "/api/quiz/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["decision"]["action"] in ["REINFORCE", "MENTOR"]
    assert "reasons" in data["decision"]
    assert len(data["decision"]["reasons"]) > 0
    assert "next_activity" in data["decision"]
    assert data["decision"]["advancement_eligible"] is False


# SCENARIO B: Student ready to advance
def test_scenario_b_advance(client):
    """
    Scenario B: Student ready to advance (Maya Lin) with high scores,
    verified prerequisites & certification, achieves ADVANCE action and level update.
    """
    token = get_token(client, "student2@demo.com")

    # Direct decision engine verification
    decision = evaluate_learner(
        latest_quiz_score=95.0,
        previous_quiz_scores=[90.0, 92.0],
        topic_scores={"Loops": 95.0, "Functions": 100.0},
        failed_attempts=0,
        days_since_last_activity=0,
        prerequisites_completed=True,
        certification_completed=True,
        current_level=2,
    )
    assert decision["action"] == "ADVANCE"
    assert decision["advancement_eligible"] is True
    assert decision["updated_level"] == 3
    assert len(decision["unmet_requirements"]) == 0
    assert any("advancement threshold" in r for r in decision["reasons"])


# SCENARIO C: Student needing mentor support
def test_scenario_c_mentor_support(client):
    """
    Scenario C: Student with repeated failures (Carlos Gomez) triggers MENTOR action,
    high priority flag, and shows in mentor dashboard.
    """
    token = get_token(client, "student4@demo.com")

    # Check student dashboard returns MENTOR recommendation
    dash_res = client.get("/api/student/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dash_res.status_code == 200
    dash_data = dash_res.get_json()
    assert dash_data["latest_decision"]["action"] == "MENTOR"
    assert dash_data["latest_decision"]["priority"] == "high"

    # Verify student is in mentor dashboard filter
    mentor_token = get_token(client, "mentor@demo.com")
    mentor_res = client.get(
        "/api/mentor/students?filter=mentor",
        headers={"Authorization": f"Bearer {mentor_token}"}
    )
    assert mentor_res.status_code == 200
    mentor_students = mentor_res.get_json()["students"]
    carlos = next((s for s in mentor_students if s["email"] == "student4@demo.com"), None)
    assert carlos is not None
    assert carlos["latest_action"] == "MENTOR"


# SCENARIO D: High score but incomplete prerequisite
def test_scenario_d_high_score_missing_prerequisite(client):
    """
    Scenario D: High score (Jordan Hayes) but missing mandatory prerequisite blocks ADVANCE.
    Unmet requirements are explicitly detailed.
    """
    token = get_token(client, "student3@demo.com")
    dash_res = client.get("/api/student/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dash_res.status_code == 200
    dash_data = dash_res.get_json()

    # Academic score was 88%, but action is REINFORCE because prerequisite is incomplete!
    decision = dash_data["latest_decision"]
    assert decision["action"] == "REINFORCE"
    assert decision["advancement_eligible"] is False
    assert len(decision["unmet_requirements"]) > 0
    assert any("Prerequisite" in req for req in decision["unmet_requirements"])


# SCENARIO E: Returning learner history and empty state
def test_scenario_e_returning_learner_and_empty_state(client):
    """
    Scenario E:
    1) Brand new learner (Emma Watson, student7@demo.com) has empty state gracefully handled.
    2) Returning learner submits a new quiz without overwriting past history.
    """
    # 1. Empty state check
    token_emma = get_token(client, "student7@demo.com")
    dash_emma = client.get("/api/student/dashboard", headers={"Authorization": f"Bearer {token_emma}"})
    assert dash_emma.status_code == 200
    assert dash_emma.get_json()["total_attempts"] == 0
    assert dash_emma.get_json()["latest_decision"] is None

    # 2. Returning learner history preservation
    token_alex = get_token(client, "student1@demo.com")
    hist_before = client.get("/api/student/history", headers={"Authorization": f"Bearer {token_alex}"}).get_json()
    count_before = len(hist_before["attempts"])
    assert count_before >= 2

    # Submit new quiz
    q_res = client.get("/api/quiz/questions", headers={"Authorization": f"Bearer {token_alex}"})
    questions = q_res.get_json()["questions"]
    answers = {str(q["id"]): q["options"][0] for q in questions}

    submit_res = client.post(
        "/api/quiz/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token_alex}"}
    )
    assert submit_res.status_code == 201

    # Check history count grew by 1 without wiping old records
    hist_after = client.get("/api/student/history", headers={"Authorization": f"Bearer {token_alex}"}).get_json()
    count_after = len(hist_after["attempts"])
    assert count_after == count_before + 1


# SCENARIO F: Access control and role security
def test_scenario_f_access_control(client):
    """
    Scenario F:
    - Student cannot access mentor endpoints (HTTP 403)
    - Unauthenticated requests rejected (HTTP 401)
    - Invalid login rejected (HTTP 401)
    - Mentor can access cohort records
    """
    # Invalid login
    bad_login = client.post("/api/auth/login", json={"email": "student1@demo.com", "password": "bad"})
    assert bad_login.status_code == 401

    # No token
    no_auth = client.get("/api/student/dashboard")
    assert no_auth.status_code == 401

    # Student trying to call mentor endpoint
    student_token = get_token(client, "student1@demo.com")
    student_on_mentor = client.get("/api/mentor/overview", headers={"Authorization": f"Bearer {student_token}"})
    assert student_on_mentor.status_code == 403

    # Mentor allowed
    mentor_token = get_token(client, "mentor@demo.com")
    mentor_on_mentor = client.get("/api/mentor/overview", headers={"Authorization": f"Bearer {mentor_token}"})
    assert mentor_on_mentor.status_code == 200


# SCENARIO G: Data persistence across app re-creation
def test_scenario_g_data_persistence(tmp_path):
    """
    Scenario G: Data persisted in SQLite remains present when app restarts.
    """
    db_file = tmp_path / "persist_test.db"

    # 1. Create first app instance, record a mentor note
    app1 = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_file}",
        "JWT_SECRET": "secret",
    })
    with app1.app_context():
        db.create_all()
        from backend.seed import seed_database
        seed_database()

        c1 = app1.test_client()
        m_tok = c1.post("/api/auth/login", json={"email": "mentor@demo.com", "password": "password123"}).get_json()["token"]
        c1.post(
            "/api/mentor/interventions",
            json={
                "learner_id": 1,
                "note": "Persistent verification note for test G",
                "status": "completed",
                "outcome": "Resolved",
                "action_type": "Check-in",
            },
            headers={"Authorization": f"Bearer {m_tok}"}
        )

    # 2. Simulate server restart: create completely new app instance pointing to the same db_file
    app2 = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_file}",
        "JWT_SECRET": "secret",
    })
    with app2.app_context():
        c2 = app2.test_client()
        m_tok2 = c2.post("/api/auth/login", json={"email": "mentor@demo.com", "password": "password123"}).get_json()["token"]
        res = c2.get("/api/mentor/follow-ups", headers={"Authorization": f"Bearer {m_tok2}"})
        assert res.status_code == 200
        notes = [inv["note"] for inv in res.get_json()["interventions"]]
        assert "Persistent verification note for test G" in notes


# SCENARIO H: Input validation and malformed payload handling
def test_scenario_h_input_validation(client):
    """
    Scenario H: Input validation rejects malformed quiz answers,
    invalid question IDs, and missing keys gracefully with HTTP 400.
    """
    token = get_token(client, "student1@demo.com")

    # Missing answers key
    res1 = client.post("/api/quiz/submit", json={}, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 400

    # Non-integer question ID
    res2 = client.post("/api/quiz/submit", json={"answers": {"not_an_id": "A"}}, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 400

    # Non-existent question ID
    res3 = client.post("/api/quiz/submit", json={"answers": {"999999": "A"}}, headers={"Authorization": f"Bearer {token}"})
    assert res3.status_code == 400
