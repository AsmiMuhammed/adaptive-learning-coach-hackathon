"""
tests/test_decision_engine.py - Unit tests for Adaptive Decision Engine.
Verifies all decision paths, edge cases, and safeguards.
"""

import pytest
from decision_engine.decision_engine import AdaptiveDecisionEngine, evaluate_learner


@pytest.fixture
def engine():
    return AdaptiveDecisionEngine()


def test_scenario_a_reinforce_on_weak_score(engine):
    """Scenario A: Score < 80% with weak topics leads to REINFORCE."""
    result = engine.evaluate(
        latest_quiz_score=60.0,
        previous_quiz_scores=[55.0],
        topic_scores={"Loops": 50.0, "Variables": 70.0},
        failed_attempts=0,
        days_since_last_activity=1,
        prerequisites_completed=True,
        certification_completed=True,
    )
    assert result.action == "REINFORCE"
    assert result.advancement_eligible is False
    assert "Loops" in result.weak_topics
    assert any("Loops" in r for r in result.reasons)
    assert "Revise Loops" in result.next_activity


def test_scenario_b_advance_on_strong_performance(engine):
    """Scenario B: Strong score, high mastery, verified prerequisites leads to ADVANCE."""
    result = engine.evaluate(
        latest_quiz_score=90.0,
        previous_quiz_scores=[85.0, 88.0],
        topic_scores={"Loops": 90.0, "Functions": 90.0},
        failed_attempts=0,
        days_since_last_activity=1,
        prerequisites_completed=True,
        certification_completed=True,
        current_level=1,
    )
    assert result.action == "ADVANCE"
    assert result.advancement_eligible is True
    assert result.updated_level == 2
    assert result.priority == "normal"
    assert any("advancement threshold" in r for r in result.reasons)


def test_scenario_c_mentor_on_persistent_failure(engine):
    """Scenario C: Multiple failed attempts leads to MENTOR."""
    result = engine.evaluate(
        latest_quiz_score=45.0,
        previous_quiz_scores=[40.0, 50.0],
        topic_scores={"Conditionals": 40.0},
        failed_attempts=2,
        days_since_last_activity=2,
        prerequisites_completed=True,
        certification_completed=True,
    )
    assert result.action == "MENTOR"
    assert result.priority == "high"
    assert result.advancement_eligible is False
    assert any("Persistent struggle" in r for r in result.reasons)


def test_scenario_d_high_score_missing_prerequisite(engine):
    """Scenario D: High score (88%) but incomplete prerequisite blocks ADVANCE."""
    result = engine.evaluate(
        latest_quiz_score=88.0,
        previous_quiz_scores=[85.0],
        topic_scores={"Functions": 88.0},
        failed_attempts=0,
        days_since_last_activity=1,
        prerequisites_completed=False,
        certification_completed=True,
        current_level=1,
    )
    assert result.action == "REINFORCE"
    assert result.advancement_eligible is False
    assert result.updated_level == 1  # Cannot advance level
    assert len(result.unmet_requirements) > 0
    assert any("Unfulfilled requirements" in r for r in result.reasons)


def test_safeguard_single_low_score_does_not_trigger_mentor(engine):
    """Safeguard: A single low quiz score on first attempt must NOT trigger mentor."""
    result = engine.evaluate(
        latest_quiz_score=50.0,
        previous_quiz_scores=[],
        topic_scores={"Variables": 50.0},
        failed_attempts=1,  # only 1 failure
        days_since_last_activity=1,
        prerequisites_completed=True,
        certification_completed=True,
    )
    assert result.action == "REINFORCE"
    assert result.action != "MENTOR"


def test_prolonged_inactivity_triggers_mentor(engine):
    """Prolonged inactivity (> 14 days) with low score triggers mentor outreach."""
    result = engine.evaluate(
        latest_quiz_score=55.0,
        previous_quiz_scores=[60.0],
        failed_attempts=1,
        days_since_last_activity=20,
    )
    assert result.action == "MENTOR"
    assert any("Prolonged inactivity" in r for r in result.reasons)


def test_helper_wrapper_returns_dict():
    """Test evaluate_learner dict wrapper."""
    out = evaluate_learner(
        latest_quiz_score=85.0,
        previous_quiz_scores=[80.0],
        prerequisites_completed=True,
        certification_completed=True,
    )
    assert isinstance(out, dict)
    assert "action" in out
    assert "reasons" in out
    assert out["action"] == "ADVANCE"
