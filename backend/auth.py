"""
auth.py - Authentication and role-based access control for AdaptIQ.
Uses secure password hashing (Werkzeug) and JSON Web Tokens (PyJWT).
"""

from datetime import datetime, timezone, timedelta
from functools import wraps
import os
import jwt
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from backend.models import db, User, Learner

JWT_SECRET = os.getenv("JWT_SECRET", "adaptiq-hackathon-secure-secret-key-2024")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRATION_HOURS = 24


def hash_password(password: str) -> str:
    """Hash password with Werkzeug scrypt/pbkdf2."""
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against stored hash."""
    return check_password_hash(password_hash, password)


def generate_token(user: User) -> str:
    """Generate signed JWT token containing user identity and role."""
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate JWT token."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def token_required(f):
    """
    Decorator that verifies presence and validity of JWT bearer token.
    Populates g.current_user and g.current_learner (if role is student).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401

        token = parts[1]
        try:
            payload = decode_token(token)
            user = db.session.get(User, payload["user_id"])
            if not user:
                return jsonify({"error": "User not found"}), 401

            g.current_user = user
            if user.role == "student":
                g.current_learner = Learner.query.filter_by(user_id=user.id).first()
            else:
                g.current_learner = None

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session token has expired. Please log in again."}), 401
        except (jwt.InvalidTokenError, Exception) as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401

        return f(*args, **kwargs)

    return decorated


def role_required(*allowed_roles):
    """
    Decorator requiring specific user roles.
    Returns 403 Forbidden if user role is not permitted.
    """
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if not g.current_user or g.current_user.role not in allowed_roles:
                return jsonify({
                    "error": f"Access denied. Requires role: {', '.join(allowed_roles)}. Your role: {g.current_user.role if g.current_user else 'anonymous'}"
                }), 403
            return f(*args, **kwargs)

        return decorated

    return decorator
