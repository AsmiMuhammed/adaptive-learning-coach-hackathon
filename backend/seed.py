"""
seed.py - Seeds the SQLite database with question bank, demo mentor,
and 10 diverse fictional learners representing all test scenarios.
Idempotent: safe to run multiple times.
"""

from datetime import datetime, timezone, timedelta
import json
from backend.models import db, User, Learner, Question, QuizAttempt, LearningDecision, MentorIntervention
from backend.auth import hash_password
from decision_engine.decision_engine import AdaptiveDecisionEngine

engine = AdaptiveDecisionEngine()

DEFAULT_PASSWORD = "password123"

QUESTIONS_DATA = [
    {
        "topic": "Variables and Data Types",
        "question_text": "In Python, which of the following expressions correctly verifies whether a variable 'x' is an instance of an integer?",
        "options": ["type(x) == int", "isinstance(x, int)", "x.is_int()", "typeof(x) == 'integer'"],
        "correct_answer": "isinstance(x, int)",
        "difficulty": "easy",
        "explanation": "isinstance(x, int) is the idiomatic Python method for type checking, as it also supports inheritance hierarchies."
    },
    {
        "topic": "Variables and Data Types",
        "question_text": "What is the result of evaluating: bool([]) in Python?",
        "options": ["True", "False", "TypeError", "None"],
        "correct_answer": "False",
        "difficulty": "easy",
        "explanation": "Empty sequences and collections (such as [], {}, '', ()) evaluate to False in a boolean context in Python."
    },
    {
        "topic": "Conditional Statements",
        "question_text": "What will be the output of: x = 10; print('High' if x > 15 else 'Medium' if x > 5 else 'Low')?",
        "options": ["High", "Medium", "Low", "SyntaxError"],
        "correct_answer": "Medium",
        "difficulty": "medium",
        "explanation": "This is a chained ternary conditional expression. Since x=10 is not >15, but is >5, it evaluates to 'Medium'."
    },
    {
        "topic": "Loops",
        "question_text": "What does the 'else' block attached to a 'for' loop in Python do?",
        "options": [
            "Executes whenever an exception occurs during loop execution",
            "Executes only if the loop terminates normally without encountering a 'break'",
            "Executes at every iteration where the condition is false",
            "Python does not support 'else' blocks on 'for' loops"
        ],
        "correct_answer": "Executes only if the loop terminates normally without encountering a 'break'",
        "difficulty": "medium",
        "explanation": "The 'else' clause of a loop executes after the loop completes all iterations naturally, but is skipped if terminated early by 'break'."
    },
    {
        "topic": "Loops",
        "question_text": "Which built-in function produces pairs of (index, item) when iterating over an iterable?",
        "options": ["zip()", "enumerate()", "items()", "range()"],
        "correct_answer": "enumerate()",
        "difficulty": "easy",
        "explanation": "enumerate(iterable) yields tuples containing a running count/index along with each item."
    },
    {
        "topic": "Functions",
        "question_text": "What is a major pitfall of defining a function with a default parameter like: def add_item(item, items=[]):?",
        "options": [
            "Default parameter values are re-evaluated on each function invocation",
            "Default mutable arguments are evaluated only once at definition time, persisting state between calls",
            "Python raises a SyntaxError when lists are used as defaults",
            "The list is converted into an immutable tuple automatically"
        ],
        "correct_answer": "Default mutable arguments are evaluated only once at definition time, persisting state between calls",
        "difficulty": "hard",
        "explanation": "Default argument expressions are evaluated once when the function definition is executed, creating a shared mutable object."
    },
    {
        "topic": "Functions",
        "question_text": "In a Python function definition, what does the syntax *args and **kwargs accomplish?",
        "options": [
            "Enforces strict type annotations on positional and keyword arguments",
            "Allows the function to accept arbitrary positional arguments and arbitrary keyword arguments",
            "Pointers to memory addresses for C-extensions",
            "Creates global variables in the enclosing module"
        ],
        "correct_answer": "Allows the function to accept arbitrary positional arguments and arbitrary keyword arguments",
        "difficulty": "medium",
        "explanation": "*args packs excess positional arguments into a tuple, while **kwargs packs excess keyword arguments into a dictionary."
    },
    {
        "topic": "Lists and Dictionaries",
        "question_text": "Which dictionary method safely retrieves a value for a key without raising a KeyError if the key is absent?",
        "options": ["dict.fetch(key, default)", "dict.get(key, default)", "dict.find(key)", "dict.retrieve(key)"],
        "correct_answer": "dict.get(key, default)",
        "difficulty": "easy",
        "explanation": "The dict.get() method returns None or the specified fallback default if the key is not found."
    },
    {
        "topic": "Lists and Dictionaries",
        "question_text": "Given data = [x**2 for x in range(5) if x % 2 == 1], what is the resulting list?",
        "options": ["[0, 1, 4, 9, 16]", "[1, 9]", "[1, 4, 9]", "[9]"],
        "correct_answer": "[1, 9]",
        "difficulty": "easy",
        "explanation": "The list comprehension filters odd numbers in range(5) (which are 1 and 3) and squares them: [1**2, 3**2] = [1, 9]."
    },
    {
        "topic": "Lists and Dictionaries",
        "question_text": "How do you merge dictionary b into dictionary a in Python 3.9+ using an operator?",
        "options": ["a = a && b", "a = a + b", "a = a | b", "a = a.merge(b)"],
        "correct_answer": "a = a | b",
        "difficulty": "medium",
        "explanation": "Python 3.9 introduced the union operators | and |= for dictionaries."
    },
]


def seed_database():
    """Seed questions, demo mentors, and realistic student profiles."""
    now = datetime.now(timezone.utc)

    # 1. Seed Questions
    existing_questions = {q.question_text: q for q in Question.query.all()}
    for q_data in QUESTIONS_DATA:
        if q_data["question_text"] not in existing_questions:
            q = Question(
                topic=q_data["topic"],
                question_text=q_data["question_text"],
                options=json.dumps(q_data["options"]),
                correct_answer=q_data["correct_answer"],
                difficulty=q_data["difficulty"],
                explanation=q_data["explanation"],
            )
            db.session.add(q)
    db.session.commit()

    # 2. Seed Mentors
    mentor_data = [
        {"name": "Dr. Evelyn Vance", "email": "mentor@demo.com", "role": "mentor"},
        {"name": "Prof. Alan Turing", "email": "coach2@demo.com", "role": "mentor"},
    ]
    for m in mentor_data:
        user = User.query.filter_by(email=m["email"]).first()
        if not user:
            user = User(
                name=m["name"],
                email=m["email"],
                role=m["role"],
                password_hash=hash_password(DEFAULT_PASSWORD),
                created_at=now - timedelta(days=60),
            )
            db.session.add(user)
    db.session.commit()

    mentor_user = User.query.filter_by(email="mentor@demo.com").first()

    # 3. Seed 10 Fictional Learners with Distinct Scenarios
    learners_specs = [
        # Student 1: Active demo student, 2 past quizzes (70%, 75%), active today
        {
            "name": "Alex Rivera",
            "email": "student1@demo.com",
            "student_id": "STU-2024-001",
            "course": "Python Fundamentals & AI Foundations",
            "level": 1,
            "lessons_completed": 4,
            "lessons_total": 10,
            "days_inactive": 1,
            "prereq": True,
            "cert": True,
            "streak": 3,
            "reviewed": False,
            "history": [
                {"score": 70.0, "raw": 7, "total": 10, "days_ago": 6, "topics": {"Variables": 80.0, "Loops": 60.0}},
                {"score": 75.0, "raw": 8, "total": 10, "days_ago": 2, "topics": {"Variables": 85.0, "Loops": 65.0}},
            ],
        },
        # Student 2: Advanced student ready to advance (Scenario B)
        {
            "name": "Maya Lin",
            "email": "student2@demo.com",
            "student_id": "STU-2024-002",
            "course": "Python Fundamentals & AI Foundations",
            "level": 2,
            "lessons_completed": 8,
            "lessons_total": 10,
            "days_inactive": 0,
            "prereq": True,
            "cert": True,
            "streak": 7,
            "reviewed": True,
            "history": [
                {"score": 85.0, "raw": 9, "total": 10, "days_ago": 5, "topics": {"Functions": 90.0, "Loops": 80.0}},
                {"score": 95.0, "raw": 10, "total": 10, "days_ago": 1, "topics": {"Functions": 100.0, "Loops": 90.0}},
            ],
        },
        # Student 3: High score BUT missing prerequisite (Scenario D)
        {
            "name": "Jordan Hayes",
            "email": "student3@demo.com",
            "student_id": "STU-2024-003",
            "course": "Python Fundamentals & AI Foundations",
            "level": 1,
            "lessons_completed": 5,
            "lessons_total": 10,
            "days_inactive": 2,
            "prereq": False,  # Missing mandatory prerequisite!
            "cert": False,
            "streak": 2,
            "reviewed": False,
            "history": [
                {"score": 88.0, "raw": 9, "total": 10, "days_ago": 2, "topics": {"Functions": 85.0, "Variables": 90.0}},
            ],
        },
        # Student 4: Struggling student with repeated failures (Scenario C)
        {
            "name": "Carlos Gomez",
            "email": "student4@demo.com",
            "student_id": "STU-2024-004",
            "course": "Python Fundamentals & AI Foundations",
            "level": 1,
            "lessons_completed": 2,
            "lessons_total": 10,
            "days_inactive": 3,
            "prereq": True,
            "cert": False,
            "streak": 0,
            "reviewed": False,
            "history": [
                {"score": 45.0, "raw": 4, "total": 10, "days_ago": 12, "topics": {"Conditionals": 40.0, "Loops": 50.0}},
                {"score": 40.0, "raw": 4, "total": 10, "days_ago": 7, "topics": {"Conditionals": 30.0, "Loops": 50.0}},
                {"score": 48.0, "raw": 5, "total": 10, "days_ago": 3, "topics": {"Conditionals": 45.0, "Loops": 50.0}},
            ],
        },
        # Student 5: Inactive student requiring mentor reach-out
        {
            "name": "Priya Sharma",
            "email": "student5@demo.com",
            "student_id": "STU-2024-005",
            "course": "Python Fundamentals & AI Foundations",
            "level": 1,
            "lessons_completed": 3,
            "lessons_total": 10,
            "days_inactive": 21,  # Inactive > 14 days
            "prereq": True,
            "cert": True,
            "streak": 0,
            "reviewed": False,
            "history": [
                {"score": 55.0, "raw": 5, "total": 10, "days_ago": 21, "topics": {"Variables": 60.0, "Loops": 50.0}},
            ],
        },
        # Student 6: Needs Reinforce on Loops & Dictionaries (Scenario A)
        {
            "name": "Liam Chen",
            "email": "student6@demo.com",
            "student_id": "STU-2024-006",
            "course": "Python Fundamentals & AI Foundations",
            "level": 1,
            "lessons_completed": 4,
            "lessons_total": 10,
            "days_inactive": 2,
            "prereq": True,
            "cert": True,
            "streak": 1,
            "reviewed": False,
            "history": [
                {"score": 62.0, "raw": 6, "total": 10, "days_ago": 2, "topics": {"Loops": 45.0, "Lists and Dictionaries": 55.0}},
            ],
        },
        # Student 7: Brand new student with 0 quiz attempts (Scenario E empty state)
        {
            "name": "Emma Watson",
            "email": "student7@demo.com",
            "student_id": "STU-2024-007",
            "course": "Python Fundamentals & AI Foundations",
            "level": 1,
            "lessons_completed": 0,
            "lessons_total": 10,
            "days_inactive": 0,
            "prereq": True,
            "cert": False,
            "streak": 1,
            "reviewed": False,
            "history": [],
        },
        # Student 8: Re-assessed student who improved following mentor check-in
        {
            "name": "David Kim",
            "email": "student8@demo.com",
            "student_id": "STU-2024-008",
            "course": "Python Fundamentals & AI Foundations",
            "level": 1,
            "lessons_completed": 6,
            "lessons_total": 10,
            "days_inactive": 1,
            "prereq": True,
            "cert": True,
            "streak": 4,
            "reviewed": True,
            "history": [
                {"score": 50.0, "raw": 5, "total": 10, "days_ago": 14, "topics": {"Functions": 45.0}},
                {"score": 78.0, "raw": 8, "total": 10, "days_ago": 1, "topics": {"Functions": 80.0}},
            ],
            "intervention": {
                "note": "Conducted 1-on-1 tutoring session on Python function signatures and scoping rules.",
                "status": "completed",
                "outcome": "Learner resolved misunderstandings and achieved 78% on follow-up quiz.",
            },
        },
        # Student 9: Fast-tracker advanced to level 3
        {
            "name": "Sophia Patel",
            "email": "student9@demo.com",
            "student_id": "STU-2024-009",
            "course": "Python Fundamentals & AI Foundations",
            "level": 3,
            "lessons_completed": 9,
            "lessons_total": 10,
            "days_inactive": 1,
            "prereq": True,
            "cert": True,
            "streak": 9,
            "reviewed": True,
            "history": [
                {"score": 92.0, "raw": 9, "total": 10, "days_ago": 1, "topics": {"Functions": 95.0, "Lists and Dictionaries": 90.0}},
            ],
        },
        # Student 10: Borderline student (74% score), assigned targeted practice
        {
            "name": "Marcus Johnson",
            "email": "student10@demo.com",
            "student_id": "STU-2024-010",
            "course": "Python Fundamentals & AI Foundations",
            "level": 1,
            "lessons_completed": 5,
            "lessons_total": 10,
            "days_inactive": 2,
            "prereq": True,
            "cert": True,
            "streak": 2,
            "reviewed": False,
            "history": [
                {"score": 74.0, "raw": 7, "total": 10, "days_ago": 2, "topics": {"Variables": 85.0, "Conditionals": 65.0}},
            ],
        },
    ]

    for spec in learners_specs:
        user = User.query.filter_by(email=spec["email"]).first()
        if not user:
            user = User(
                name=spec["name"],
                email=spec["email"],
                role="student",
                password_hash=hash_password(DEFAULT_PASSWORD),
                created_at=now - timedelta(days=30),
            )
            db.session.add(user)
            db.session.flush()

        learner = Learner.query.filter_by(user_id=user.id).first()
        if not learner:
            learner = Learner(
                user_id=user.id,
                student_id_code=spec["student_id"],
                course=spec["course"],
                current_level=spec["level"],
                lessons_completed=spec["lessons_completed"],
                lessons_total=spec["lessons_total"],
                last_activity=now - timedelta(days=spec["days_inactive"]),
                days_since_last_activity=spec["days_inactive"],
                prerequisites_completed=spec["prereq"],
                certification_completed=spec["cert"],
                streak_days=spec["streak"],
                reviewed_by_mentor=spec["reviewed"],
            )
            db.session.add(learner)
            db.session.flush()

            # Seed history if not already present
            past_scores = []
            failed_count = 0
            for h in spec["history"]:
                attempt_time = now - timedelta(days=h["days_ago"])
                if h["score"] < 60.0:
                    failed_count += 1

                # Evaluate decision for each historical attempt
                decision_res = engine.evaluate(
                    latest_quiz_score=h["score"],
                    previous_quiz_scores=past_scores.copy(),
                    topic_scores=h["topics"],
                    failed_attempts=failed_count,
                    days_since_last_activity=spec["days_inactive"],
                    lessons_completed=spec["lessons_completed"],
                    total_lessons=spec["lessons_total"],
                    prerequisites_completed=spec["prereq"],
                    certification_completed=spec["cert"],
                    current_level=spec["level"],
                )

                attempt = QuizAttempt(
                    learner_id=learner.id,
                    timestamp=attempt_time,
                    score=h["score"],
                    raw_score=h["raw"],
                    total_questions=h["total"],
                    topic_scores=json.dumps(h["topics"]),
                    answers_summary=json.dumps([]),
                )
                db.session.add(attempt)
                db.session.flush()

                decision = LearningDecision(
                    learner_id=learner.id,
                    quiz_attempt_id=attempt.id,
                    timestamp=attempt_time,
                    action=decision_res.action,
                    reasons=json.dumps(decision_res.reasons),
                    next_activity=decision_res.next_activity,
                    priority=decision_res.priority,
                    mastery=decision_res.mastery,
                    advancement_eligible=decision_res.advancement_eligible,
                    unmet_requirements=json.dumps(decision_res.unmet_requirements),
                    score_trend=decision_res.score_trend,
                )
                db.session.add(decision)
                past_scores.append(h["score"])

            # Seed intervention if defined
            if "intervention" in spec and mentor_user:
                inv = MentorIntervention(
                    learner_id=learner.id,
                    mentor_id=mentor_user.id,
                    timestamp=now - timedelta(days=5),
                    note=spec["intervention"]["note"],
                    status=spec["intervention"]["status"],
                    outcome=spec["intervention"]["outcome"],
                    action_type="1-on-1 Tutoring Session",
                )
                db.session.add(inv)

    db.session.commit()
    print("Database seeding completed successfully.")
