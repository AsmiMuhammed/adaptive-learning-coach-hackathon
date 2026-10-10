"""
decision_engine.py - Transparent, Explainable Adaptive Learning Decision Engine.

Part of AdaptIQ (Hackathon Problem #8).
Evaluates student performance, engagement, topic mastery, and history to recommend
one of three distinct actions: REINFORCE, ADVANCE, or MENTOR.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any


# Configurable Demonstration Thresholds (Documented as demonstration settings)
ADVANCEMENT_SCORE_THRESHOLD = 80.0   # Score required for level advancement (%)
MASTERY_THRESHOLD = 75.0             # Topic mastery required for advancement (%)
PASSING_SCORE_THRESHOLD = 60.0       # Passing threshold for a quiz attempt (%)
PERSISTENT_FAILURE_THRESHOLD = 2    # Failed attempts triggering mentor intervention
INACTIVITY_DAYS_THRESHOLD = 14       # Inactivity days triggering mentor outreach
BORDERLINE_SCORE_THRESHOLD = 70.0    # Borderline zone (70% - 79%)


@dataclass
class DecisionResult:
    action: str                       # 'REINFORCE', 'ADVANCE', or 'MENTOR'
    reasons: List[str]                # Transparent list of explanatory factors
    next_activity: str                # Specific recommended learning activity
    priority: str                     # 'normal', 'medium', or 'high'
    mastery: float                    # Estimated overall mastery percentage (0-100)
    advancement_eligible: bool        # True if learner meets all academic & prereq requirements
    unmet_requirements: List[str]     # Specific prerequisites/certifications preventing advancement
    updated_level: int                # New learner level if advanced, otherwise current level
    score_trend: str                  # 'improving', 'declining', 'stable', 'single_assessment', or 'none'
    topic_breakdown: Dict[str, float] = field(default_factory=dict)
    weak_topics: List[str] = field(default_factory=list)
    strong_topics: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AdaptiveDecisionEngine:
    """
    Multi-factor, explainable adaptive learning decision engine.
    Ensures safe, transparent decisions based on performance, history, and prerequisites.
    """

    def __init__(
        self,
        advancement_threshold: float = ADVANCEMENT_SCORE_THRESHOLD,
        mastery_threshold: float = MASTERY_THRESHOLD,
        passing_threshold: float = PASSING_SCORE_THRESHOLD,
        persistent_failure_limit: int = PERSISTENT_FAILURE_THRESHOLD,
        inactivity_days_limit: int = INACTIVITY_DAYS_THRESHOLD,
    ):
        self.advancement_threshold = advancement_threshold
        self.mastery_threshold = mastery_threshold
        self.passing_threshold = passing_threshold
        self.persistent_failure_limit = persistent_failure_limit
        self.inactivity_days_limit = inactivity_days_limit

    def evaluate(
        self,
        latest_quiz_score: float,
        previous_quiz_scores: Optional[List[float]] = None,
        topic_scores: Optional[Dict[str, float]] = None,
        failed_attempts: int = 0,
        days_since_last_activity: int = 0,
        lessons_completed: int = 0,
        total_lessons: int = 10,
        prerequisites_completed: bool = True,
        certification_completed: bool = True,
        previous_recommendation: Optional[str] = None,
        mentor_intervention_status: str = "none",
        current_level: int = 1,
    ) -> DecisionResult:
        """
        Evaluate learner features and produce a transparent, explainable decision.
        """
        reasons: List[str] = []
        unmet_requirements: List[str] = []
        previous_scores = previous_quiz_scores or []

        # 1. Topic Mastery & Breakdown Analysis
        weak_topics: List[str] = []
        strong_topics: List[str] = []
        topic_breakdown = topic_scores or {}

        if topic_breakdown:
            calculated_mastery = sum(topic_breakdown.values()) / max(len(topic_breakdown), 1)
            for topic, score in topic_breakdown.items():
                if score < 70.0:
                    weak_topics.append(topic)
                elif score >= 80.0:
                    strong_topics.append(topic)
        else:
            # If no fine-grained topic scores, derive estimated mastery from latest and history
            if previous_scores:
                all_scores = previous_scores + [latest_quiz_score]
                calculated_mastery = sum(all_scores) / len(all_scores)
            else:
                calculated_mastery = float(latest_quiz_score)

        # 2. Score Trend Analysis
        if len(previous_scores) >= 2:
            prev_avg = sum(previous_scores) / len(previous_scores)
            if latest_quiz_score > prev_avg + 5:
                score_trend = "improving"
            elif latest_quiz_score < prev_avg - 5:
                score_trend = "declining"
            else:
                score_trend = "stable"
        elif len(previous_scores) == 1:
            diff = latest_quiz_score - previous_scores[0]
            if diff >= 5:
                score_trend = "improving"
            elif diff <= -5:
                score_trend = "declining"
            else:
                score_trend = "stable"
        elif latest_quiz_score > 0:
            score_trend = "single_assessment"
        else:
            score_trend = "none"

        # 3. Check Prerequisites & Certification
        if not prerequisites_completed:
            unmet_requirements.append("Mandatory Course Prerequisites Incomplete")
        if not certification_completed:
            unmet_requirements.append("Foundational Certification Assessment Incomplete")

        # 4. Multi-Factor Decision Evaluation

        # --- CONDITION A: MENTOR INTERVENTION ---
        # Safeguard: A single low quiz score should NOT automatically trigger mentor intervention.
        # Requires persistent difficulty, prolonged inactivity with low engagement, or repeated failure pattern.
        is_persistent_failure = (
            failed_attempts >= self.persistent_failure_limit and latest_quiz_score < self.passing_threshold
        ) or (failed_attempts >= 3)

        is_prolonged_inactivity_with_struggle = (
            days_since_last_activity >= self.inactivity_days_limit
            and (latest_quiz_score < 65.0 or failed_attempts > 0)
        )

        is_critical_decline = (
            score_trend == "declining"
            and latest_quiz_score < 50.0
            and len(previous_scores) >= 1
            and failed_attempts >= 1
        )

        if is_persistent_failure or is_prolonged_inactivity_with_struggle or is_critical_decline:
            action = "MENTOR"
            priority = "high"
            advancement_eligible = False
            updated_level = current_level

            if is_persistent_failure:
                reasons.append(
                    f"Persistent struggle detected: {failed_attempts} failed attempts with latest score {latest_quiz_score:.1f}% below passing standard ({self.passing_threshold}%)."
                )
            if is_prolonged_inactivity_with_struggle:
                reasons.append(
                    f"Prolonged inactivity detected ({days_since_last_activity} days inactive) accompanied by low assessment performance."
                )
            if is_critical_decline:
                reasons.append(
                    f"Significant downward score trend observed (latest score {latest_quiz_score:.1f}%), indicating emerging conceptual confusion."
                )

            if weak_topics:
                reasons.append(f"Identified vulnerable topic areas: {', '.join(weak_topics)}.")

            next_activity = (
                f"Schedule 1-on-1 Mentor Consultation & Targeted Diagnostic Review"
                + (f" on {weak_topics[0]}" if weak_topics else " on Core Concepts")
            )

            return DecisionResult(
                action=action,
                reasons=reasons,
                next_activity=next_activity,
                priority=priority,
                mastery=round(calculated_mastery, 1),
                advancement_eligible=advancement_eligible,
                unmet_requirements=unmet_requirements,
                updated_level=updated_level,
                score_trend=score_trend,
                topic_breakdown=topic_breakdown,
                weak_topics=weak_topics,
                strong_topics=strong_topics,
            )

        # --- CONDITION B: ADVANCE EVALUATION ---
        # Learner must score >= 80% AND mastery >= 75% AND satisfy all prerequisites and certifications.
        meets_academic_advancement = (
            latest_quiz_score >= self.advancement_threshold
            and calculated_mastery >= self.mastery_threshold
        )

        if meets_academic_advancement:
            # Check prerequisites & certifications
            if prerequisites_completed and certification_completed:
                action = "ADVANCE"
                priority = "normal"
                advancement_eligible = True
                updated_level = current_level + 1

                reasons.append(
                    f"Latest quiz score of {latest_quiz_score:.1f}% satisfies advancement threshold (>= {self.advancement_threshold}%)."
                )
                reasons.append(
                    f"Estimated topic mastery of {calculated_mastery:.1f}% satisfies mastery threshold (>= {self.mastery_threshold}%)."
                )
                reasons.append("All mandatory prerequisite modules and certification benchmarks are verified.")
                if strong_topics:
                    reasons.append(f"Demonstrated high proficiency in: {', '.join(strong_topics)}.")

                next_activity = f"Unlock Level {updated_level}: Advanced Algorithms, Object-Oriented Design & Optimization"
                return DecisionResult(
                    action=action,
                    reasons=reasons,
                    next_activity=next_activity,
                    priority=priority,
                    mastery=round(calculated_mastery, 1),
                    advancement_eligible=advancement_eligible,
                    unmet_requirements=[],
                    updated_level=updated_level,
                    score_trend=score_trend,
                    topic_breakdown=topic_breakdown,
                    weak_topics=weak_topics,
                    strong_topics=strong_topics,
                )
            else:
                # High score alone MUST NOT override mandatory prerequisites!
                action = "REINFORCE"
                priority = "medium"
                advancement_eligible = False
                updated_level = current_level

                reasons.append(
                    f"Excellent assessment score ({latest_quiz_score:.1f}%) and mastery ({calculated_mastery:.1f}%) qualify academically for advancement."
                )
                reasons.append(
                    f"Advancement on hold: Unfulfilled requirements: {', '.join(unmet_requirements)}."
                )
                reasons.append("Mandatory prerequisites ensure foundational competency before unlocking higher-level content.")

                next_activity = f"Complete required prerequisite coursework ({unmet_requirements[0]}) to unlock Level {current_level + 1} advancement."
                return DecisionResult(
                    action=action,
                    reasons=reasons,
                    next_activity=next_activity,
                    priority=priority,
                    mastery=round(calculated_mastery, 1),
                    advancement_eligible=advancement_eligible,
                    unmet_requirements=unmet_requirements,
                    updated_level=updated_level,
                    score_trend=score_trend,
                    topic_breakdown=topic_breakdown,
                    weak_topics=weak_topics,
                    strong_topics=strong_topics,
                )

        # --- CONDITION C: REINFORCE EVALUATION ---
        action = "REINFORCE"
        updated_level = current_level
        advancement_eligible = False

        if latest_quiz_score >= BORDERLINE_SCORE_THRESHOLD:
            priority = "normal"
            reasons.append(
                f"Borderline assessment score ({latest_quiz_score:.1f}%). Learner shows foundational grasp but falls short of the {self.advancement_threshold}% advancement threshold."
            )
        elif latest_quiz_score >= self.passing_threshold:
            priority = "normal"
            reasons.append(
                f"Passing assessment score ({latest_quiz_score:.1f}%), but mastery ({calculated_mastery:.1f}%) requires reinforcement before progressing."
            )
        else:
            priority = "medium"
            reasons.append(
                f"Assessment score of {latest_quiz_score:.1f}% is below the {self.passing_threshold}% passing standard."
            )

        if score_trend == "declining":
            reasons.append("Recent score trajectory shows a decline compared to earlier attempts.")
        elif score_trend == "improving":
            reasons.append("Positive score improvement noted compared to previous attempts.")

        if weak_topics:
            weak_str = ", ".join(weak_topics)
            reasons.append(f"Targeted review required for weaker topic areas: {weak_str}.")
            next_activity = f"Revise {weak_str}: Complete targeted practice drills and retake the assessment."
        else:
            next_activity = "Complete targeted practice drills on Python Fundamentals and retake the module assessment."

        return DecisionResult(
            action=action,
            reasons=reasons,
            next_activity=next_activity,
            priority=priority,
            mastery=round(calculated_mastery, 1),
            advancement_eligible=advancement_eligible,
            unmet_requirements=unmet_requirements,
            updated_level=updated_level,
            score_trend=score_trend,
            topic_breakdown=topic_breakdown,
            weak_topics=weak_topics,
            strong_topics=strong_topics,
        )


def evaluate_learner(**kwargs) -> Dict[str, Any]:
    """Helper functional wrapper returning dictionary."""
    engine = AdaptiveDecisionEngine()
    result = engine.evaluate(**kwargs)
    return result.to_dict()
