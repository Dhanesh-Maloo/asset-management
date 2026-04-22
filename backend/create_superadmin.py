"""
Run this once to create the super admin account.
Usage: python create_superadmin.py
"""
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "")
DB_NAME   = os.environ.get("DB_NAME", "asset_management")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SUPER_ADMIN_EMAIL    = "admin@test.com"
SUPER_ADMIN_PASSWORD = "Admin@123456"
SUPER_ADMIN_NAME     = "Super Admin"

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    existing = await db.users.find_one({"email": SUPER_ADMIN_EMAIL})
    if existing:
        print(f"Super admin already exists: {SUPER_ADMIN_EMAIL}")
        client.close()
        return

    doc = {
        "id": str(uuid.uuid4()),
        "email": SUPER_ADMIN_EMAIL,
        "name": SUPER_ADMIN_NAME,
        "role": "super_admin",
        "tenant_id": None,
        "group_id": None,
        "department_id": None,
        "permissions": [],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "password_hash": pwd_context.hash(SUPER_ADMIN_PASSWORD),
    }

    await db.users.insert_one(doc)
    client.close()

    print("=" * 45)
    print("  Super Admin created successfully!")
    print("=" * 45)
    print(f"  Email   : {SUPER_ADMIN_EMAIL}")
    print(f"  Password: {SUPER_ADMIN_PASSWORD}")
    print("=" * 45)
    print("  Go to http://localhost:3000/login to sign in.")

asyncio.run(main())
