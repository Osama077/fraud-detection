"""
Seed script — run once after docker compose up to bootstrap the database.

Usage:
    docker compose exec backend python -m scripts.seed

Creates:
  - Admin user (admin@fraudshield.com / Admin1234!)
  - Analyst user (analyst@fraudshield.com / Analyst1234!)
  - Model version record (if artifacts exist)
"""

import asyncio
import uuid
import json
from pathlib import Path
from sqlalchemy import select

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.session import AsyncSessionLocal, engine, Base
from app.models.models import User, UserRole, ModelVersion, AlgorithmType
from app.core.security import hash_password

ARTIFACTS = Path(__file__).parent.parent / "app" / "ml" / "artifacts"

SEED_USERS = [
    {
        "email":         "admin@fraudshield.com",
        "password":      "Admin1234!",
        "full_name":     "System Admin",
        "role":          UserRole.admin,
    },
    {
        "email":         "analyst@fraudshield.com",
        "password":      "Analyst1234!",
        "full_name":     "Default Analyst",
        "role":          UserRole.analyst,
    },
]


async def seed():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # ── Users ────────────────────────────────────────────────────────────
        for u in SEED_USERS:
            existing = (await db.execute(
                select(User).where(User.email == u["email"])
            )).scalar_one_or_none()

            if existing:
                print(f"[Seed] User already exists: {u['email']}")
                continue

            user = User(
                email=u["email"],
                password_hash=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                is_active=True,
            )
            db.add(user)
            print(f"[Seed] Created user: {u['email']} ({u['role']})")

        await db.flush()

        # ── Model version ─────────────────────────────────────────────────────
        lr_path    = ARTIFACTS / "logistic_regression.pkl"
        scaler_path = ARTIFACTS / "scaler.pkl"
        meta_path  = ARTIFACTS / "lr_metadata.json"

        if lr_path.exists():
            existing_mv = (await db.execute(
                select(ModelVersion).where(ModelVersion.version_tag == "v1.0.0")
            )).scalar_one_or_none()

            if not existing_mv:
                hyperparams = {}
                if meta_path.exists():
                    with open(meta_path) as f:
                        hyperparams = json.load(f)

                mv = ModelVersion(
                    version_tag="v1.0.0",
                    algorithm=AlgorithmType.logistic_regression,
                    artifact_path=str(lr_path),
                    precision_score=hyperparams.get("precision"),
                    recall_score=hyperparams.get("recall"),
                    f1_score=hyperparams.get("f1"),
                    auc_roc=hyperparams.get("auc_roc"),
                    smote_applied=True,
                    hyperparams=hyperparams,
                    is_active=True,
                )
                db.add(mv)
                print("[Seed] Registered model v1.0.0")
            else:
                print("[Seed] Model v1.0.0 already registered")
        else:
            print("[Seed] No model artifacts found — run training pipeline first")

        await db.commit()
        print("\n[Seed] ✓ Database seeded successfully")
        print("  Admin login  : admin@fraudshield.com  / Admin1234!")
        print("  Analyst login: analyst@fraudshield.com / Analyst1234!")


if __name__ == "__main__":
    asyncio.run(seed())
