"""
auth_routes.py - Authentication endpoints for login, profile check, and demo users.
"""

from flask import Blueprint, request, jsonify, g
from backend.models import db, User, Learner
from backend.auth import verify_password, generate_token, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(user)
    learner_data = None
    if user.role == "student":
        learner = Learner.query.filter_by(user_id=user.id).first()
        if learner:
            learner_data = learner.to_dict(include_details=False)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict(),
        "learner": learner_data,
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    user = g.current_user
    learner_data = None
    if user.role == "student" and g.current_learner:
        learner_data = g.current_learner.to_dict(include_details=True)

    return jsonify({
        "user": user.to_dict(),
        "learner": learner_data,
    }), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Successfully logged out"}), 200


@auth_bp.route("/demo-accounts", methods=["GET"])
def get_demo_accounts():
    """Returns available seeded demo accounts for quick hackathon evaluator testing."""
    users = User.query.all()
    accounts = []
    for u in users:
        accounts.append({
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "demo_password": "password123",
        })
    return jsonify({"accounts": accounts}), 200
