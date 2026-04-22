"""
Tenant Data Separation Test
============================
Registers 2 tenants (Bhumika + TestOrg), creates data for each,
then verifies each tenant can ONLY see their own data.

Run with:
    python tests/test_tenant_separation.py

Make sure the backend is running:
    cd backend && uvicorn server:app --reload
"""

import requests
import sys
from datetime import datetime

BACKEND = "http://localhost:8000/api"


def ok(msg):
    print(f"    \u2713 {msg}")


def fail(msg):
    print(f"    \u2717 {msg}")


def signup_tenant(company_name, admin_name, admin_email, admin_password, domain, subdomain):
    r = requests.post(
        f"{BACKEND}/auth/signup",
        params={
            "company_name": company_name,
            "admin_name": admin_name,
            "admin_email": admin_email,
            "admin_password": admin_password,
            "domain": domain,
            "subdomain": subdomain,
        },
    )
    return r


def login(email, password):
    r = requests.post(f"{BACKEND}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]


def create_ticket(token, title, description="Test ticket for data separation"):
    r = requests.post(
        f"{BACKEND}/tickets",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": title, "description": description, "priority": "medium", "category": "general"},
    )
    r.raise_for_status()
    return r.json()


def get_tickets(token):
    r = requests.get(
        f"{BACKEND}/tickets",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    data = r.json()
    # Handle both list response and paginated response
    if isinstance(data, list):
        return data
    return data.get("tickets", data.get("items", []))


def run_tests():
    ts = datetime.now().strftime("%H%M%S")

    bhumika_email = f"bhumika.admin.{ts}@bhumika.com"
    bhumika_pass = "Bhumika@123"

    testorg_email = f"admin.{ts}@testorg.com"
    testorg_pass = "TestOrg@123"

    errors = []

    print()
    print("=" * 60)
    print("  TENANT DATA SEPARATION TEST")
    print("=" * 60)

    # ── Step 1: Register Bhumika ──────────────────────────────────
    print("\n[1] Registering tenant: Bhumika")
    r = signup_tenant("Bhumika", "Bhumika Admin", bhumika_email, bhumika_pass, "bhumika.com", f"bhumika{ts}")
    if r.status_code == 200:
        bhumika_tenant_id = r.json()["tenant_id"]
        ok(f"Bhumika tenant created  (tenant_id: {bhumika_tenant_id[:8]}...)")
    else:
        fail(f"Failed to create Bhumika tenant: {r.text}")
        sys.exit(1)

    # ── Step 2: Register TestOrg ──────────────────────────────────
    print("\n[2] Registering tenant: TestOrg")
    r = signup_tenant("TestOrg", "TestOrg Admin", testorg_email, testorg_pass, "testorg.com", f"testorg{ts}")
    if r.status_code == 200:
        testorg_tenant_id = r.json()["tenant_id"]
        ok(f"TestOrg tenant created  (tenant_id: {testorg_tenant_id[:8]}...)")
    else:
        fail(f"Failed to create TestOrg tenant: {r.text}")
        sys.exit(1)

    # ── Step 3: Login ─────────────────────────────────────────────
    print("\n[3] Logging in as both admins")
    try:
        bhumika_token = login(bhumika_email, bhumika_pass)
        ok("Bhumika logged in")
    except Exception as e:
        fail(f"Bhumika login failed: {e}")
        sys.exit(1)

    try:
        testorg_token = login(testorg_email, testorg_pass)
        ok("TestOrg logged in")
    except Exception as e:
        fail(f"TestOrg login failed: {e}")
        sys.exit(1)

    # ── Step 4: Create tickets as Bhumika ─────────────────────────
    print("\n[4] Creating tickets for Bhumika")
    try:
        create_ticket(bhumika_token, "Bhumika Ticket 1 - Laptop Issue")
        create_ticket(bhumika_token, "Bhumika Ticket 2 - Printer Problem")
        ok("Created: 'Bhumika Ticket 1', 'Bhumika Ticket 2'")
    except Exception as e:
        fail(f"Failed to create Bhumika tickets: {e}")
        errors.append("Could not create Bhumika tickets")

    # ── Step 5: Create tickets as TestOrg ────────────────────────
    print("\n[5] Creating tickets for TestOrg")
    try:
        create_ticket(testorg_token, "TestOrg Ticket 1 - Server Down")
        ok("Created: 'TestOrg Ticket 1'")
    except Exception as e:
        fail(f"Failed to create TestOrg ticket: {e}")
        errors.append("Could not create TestOrg tickets")

    # ── Step 6: Verify data separation ───────────────────────────
    print("\n[6] Verifying data separation...")

    bhumika_tickets = get_tickets(bhumika_token)
    testorg_tickets = get_tickets(testorg_token)

    bhumika_titles = [t["title"] for t in bhumika_tickets]
    testorg_titles = [t["title"] for t in testorg_tickets]

    print(f"\n    Bhumika sees {len(bhumika_titles)} ticket(s):")
    for t in bhumika_titles:
        print(f"      - {t}")

    print(f"\n    TestOrg sees {len(testorg_titles)} ticket(s):")
    for t in testorg_titles:
        print(f"      - {t}")

    # ── Assertions ────────────────────────────────────────────────
    print("\n[7] Running assertions...")

    # Bhumika should see her own tickets
    if "Bhumika Ticket 1 - Laptop Issue" in bhumika_titles:
        ok("Bhumika can see her own Ticket 1")
    else:
        fail("Bhumika CANNOT see her own Ticket 1")
        errors.append("Bhumika missing her own ticket 1")

    if "Bhumika Ticket 2 - Printer Problem" in bhumika_titles:
        ok("Bhumika can see her own Ticket 2")
    else:
        fail("Bhumika CANNOT see her own Ticket 2")
        errors.append("Bhumika missing her own ticket 2")

    # Bhumika should NOT see TestOrg's tickets
    if "TestOrg Ticket 1 - Server Down" not in bhumika_titles:
        ok("Bhumika CANNOT see TestOrg's tickets (correct!)")
    else:
        fail("DATA LEAK: Bhumika CAN see TestOrg's ticket!")
        errors.append("DATA LEAK: Bhumika sees TestOrg ticket")

    # TestOrg should see their own ticket
    if "TestOrg Ticket 1 - Server Down" in testorg_titles:
        ok("TestOrg can see their own Ticket 1")
    else:
        fail("TestOrg CANNOT see their own Ticket 1")
        errors.append("TestOrg missing their own ticket")

    # TestOrg should NOT see Bhumika's tickets
    if "Bhumika Ticket 1 - Laptop Issue" not in testorg_titles:
        ok("TestOrg CANNOT see Bhumika's tickets (correct!)")
    else:
        fail("DATA LEAK: TestOrg CAN see Bhumika's ticket!")
        errors.append("DATA LEAK: TestOrg sees Bhumika ticket")

    if "Bhumika Ticket 2 - Printer Problem" not in testorg_titles:
        ok("TestOrg CANNOT see Bhumika's Ticket 2 (correct!)")
    else:
        fail("DATA LEAK: TestOrg CAN see Bhumika's Ticket 2!")
        errors.append("DATA LEAK: TestOrg sees Bhumika ticket 2")

    # ── Summary ───────────────────────────────────────────────────
    print()
    print("=" * 60)
    if errors:
        print("  RESULT: FAILED")
        print()
        for e in errors:
            print(f"  \u2717 {e}")
    else:
        print("  RESULT: ALL TESTS PASSED \u2713")
        print()
        print("  \u2713 Each tenant sees ONLY their own data")
        print("  \u2713 No data leaks between Bhumika and TestOrg")
        print("  \u2713 Multi-tenant isolation is working correctly")
    print("=" * 60)
    print()

    return len(errors) == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
