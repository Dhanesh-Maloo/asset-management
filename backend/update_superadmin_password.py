"""
Run this to update the super admin password.
Usage: NEW_PASSWORD=yourpassword python update_superadmin_password.py
   or: python update_superadmin_password.py  (will prompt for password)
"""
import asyncio
import getpass
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "")
DB_NAME   = os.environ.get("DB_NAME", "asset_management")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SUPER_ADMIN_EMAIL = "admin@test.com"

async def main():
    new_password = os.environ.get("NEW_PASSWORD") or getpass.getpass("Enter new super admin password: ")
    if not new_password:
        print("ERROR: Password cannot be empty.")
        return

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    result = await db.users.update_one(
        {"email": SUPER_ADMIN_EMAIL, "role": "super_admin"},
        {"$set": {"password_hash": pwd_context.hash(new_password)}}
    )
    client.close()

    if result.matched_count == 0:
        print("ERROR: Super admin not found. Make sure create_superadmin.py was run first.")
    else:
        print("=" * 45)
        print("  Super Admin password updated!")
        print("=" * 45)
        print(f"  Email   : {SUPER_ADMIN_EMAIL}")
        print("=" * 45)
        print("  Go to http://localhost:3000/login to sign in.")

asyncio.run(main())
