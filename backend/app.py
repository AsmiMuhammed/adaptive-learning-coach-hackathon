"""
app.py - Main Flask Application for AdaptIQ - AI-Powered Adaptive Learning Coach.
Hackathon Problem #8.
"""

import os
import sys
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS

# Add root directory to sys.path so decision_engine can be imported seamlessly
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.models import db, User
from backend.routes.auth_routes import auth_bp
from backend.routes.student_routes import student_bp
from backend.routes.quiz_routes import quiz_bp
from backend.routes.mentor_routes import mentor_bp
from backend.seed import seed_database


def create_app(test_config=None):
    """Application factory for AdaptIQ."""
    app = Flask(__name__)

    # Default configuration
    db_path = os.getenv("DATABASE_PATH", str(ROOT_DIR / "backend" / "adaptiq.db"))
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "adaptiq-hackathon-flask-secret-2024")

    if test_config:
        app.config.update(test_config)

    # Enable CORS
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    CORS(app, resources={r"/api/*": {"origins": [o.strip() for o in cors_origins]}}, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(mentor_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "AdaptIQ Adaptive Learning Coach API",
            "version": "1.0.0",
        }), 200

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "detail": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal Server Error", "detail": str(e)}), 500

    with app.app_context():
        db.create_all()
        # Seed if users table is empty
        if User.query.count() == 0:
            seed_database()

    return app


app = create_app()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "seed":
        with app.app_context():
            db.create_all()
            seed_database()
            print("Database seeded manually.")
    else:
        port = int(os.getenv("PORT", 5001))
        debug = os.getenv("DEBUG", "True").lower() == "true"
        print(f"Starting AdaptIQ Backend on http://127.0.0.1:{port}")
        app.run(host="0.0.0.0", port=port, debug=debug)
