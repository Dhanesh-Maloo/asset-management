"""
Full Test Suite - IT Asset Management App
==========================================
Creates its own test data from scratch.
No pre-existing users or data required.

Run with:
    python tests/full_test_suite.py

Backend must be running at http://localhost:8000
"""

import requests
import sys
from datetime import datetime, timedelta

BASE = "http://localhost:8000/api"
PASS = 0
FAIL = 0
FAILURES = []

def ok(section, msg):
    global PASS
    PASS += 1
    print(f"  [PASS] {section}: {msg}")

def fail(section, msg, detail=""):
    global FAIL
    FAIL += 1
    note = f" => {detail}" if detail else ""
    print(f"  [FAIL] {section}: {msg}{note}")
    FAILURES.append(f"{section}: {msg}{note}")

def post(url, data=None, token=None, params=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.post(url, json=data, headers=h, params=params, timeout=10)

def get(url, token=None, params=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.get(url, headers=h, params=params, timeout=10)

def delete(url, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.delete(url, headers=h, timeout=10)

def patch(url, data=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.patch(url, json=data, headers=h, timeout=10)

TS = datetime.now().strftime("%H%M%S")

# ─────────────────────────────────────────────────────────────────────────────
# 1. HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────
def test_health():
    print("\n[1] Health Check")
    r = requests.get("http://localhost:8000/health", timeout=5)
    if r.status_code == 200 and r.json().get("status") == "ok":
        ok("Health", "Backend is running and database is connected")
    else:
        fail("Health", "Backend not responding", r.text)

# ─────────────────────────────────────────────────────────────────────────────
# 2. SIGNUP — Create fresh tenant + admin
# ─────────────────────────────────────────────────────────────────────────────
def test_signup():
    print("\n[2] Signup — Create Tenant Alpha (admin)")
    r = requests.post(f"{BASE}/auth/signup", params={
        "company_name": f"Alpha Corp {TS}",
        "admin_name": "Alpha Admin",
        "admin_email": f"alpha.admin.{TS}@alpha.com",
        "admin_password": "Alpha@1234",
        "domain": f"alpha{TS}.com",
        "subdomain": f"alpha{TS}",
        "currency": "INR",
    }, timeout=10)
    if r.status_code == 200:
        ok("Signup", f"Tenant 'Alpha Corp {TS}' created")
        return r.json()["tenant_id"], f"alpha.admin.{TS}@alpha.com", "Alpha@1234"
    else:
        fail("Signup", "Could not create tenant", r.text)
        sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# 3. LOGIN
# ─────────────────────────────────────────────────────────────────────────────
def test_login(email, password, label="admin"):
    print(f"\n[3] Login — {label}")
    r = post(f"{BASE}/auth/login", {"email": email, "password": password})
    data = r.json() if r.status_code == 200 else {}
    tok = data.get("access_token") or data.get("token")
    if r.status_code == 200 and tok:
        ok("Login", f"{label} logged in successfully")
        return tok
    else:
        fail("Login", f"{label} login failed", r.text)
        sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# 4. DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────
def test_dashboard(token):
    print("\n[4] Dashboard Stats")
    r = get(f"{BASE}/dashboard/stats", token)
    if r.status_code == 200:
        d = r.json()
        required = ["total_assets", "available_assets", "open_tickets", "pending_orders"]
        missing = [k for k in required if k not in d]
        if not missing:
            ok("Dashboard", f"Stats returned — assets: {d.get('total_assets',0)}, tickets: {d.get('open_tickets',0)}")
        else:
            fail("Dashboard", "Missing fields", str(missing))
    else:
        fail("Dashboard", "Stats endpoint failed", r.text)

# ─────────────────────────────────────────────────────────────────────────────
# 5. PRODUCTS
# ─────────────────────────────────────────────────────────────────────────────
def test_products(token, tenant_id):
    print("\n[5] Products (Create / List)")
    # Create
    r = post(f"{BASE}/products", {
        "name": f"Test Laptop {TS}",
        "sku": f"LAP-{TS}",
        "description": "Test product for full test suite",
        "category": "Laptop",
        "price": 45000.0,
        "stock_quantity": 10,
        "tenant_id": tenant_id,
    }, token)
    if r.status_code == 200:
        product_id = r.json()["id"]
        ok("Products", f"Product created — id: {product_id[:8]}...")
    else:
        fail("Products", "Create failed", r.text)
        return None

    # List
    r = get(f"{BASE}/products", token)
    if r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0:
        ok("Products", f"List returned {len(r.json())} product(s)")
    else:
        fail("Products", "List failed", r.text)

    return product_id

# ─────────────────────────────────────────────────────────────────────────────
# 6. ASSETS
# ─────────────────────────────────────────────────────────────────────────────
def test_assets(token, tenant_id, product_id):
    print("\n[6] Assets (Create / List / Update)")
    # Create
    r = post(f"{BASE}/assets", {
        "asset_tag": f"ASSET-{TS}",
        "product_id": product_id,
        "serial_number": f"SN-{TS}",
        "tenant_id": tenant_id,
        "location": "Head Office - Floor 2",
        "purchase_date": "2024-01-15",
        "purchase_price": 45000.0,
    }, token)
    if r.status_code == 200:
        asset_id = r.json()["id"]
        ok("Assets", f"Asset created — tag: ASSET-{TS}")
    else:
        fail("Assets", "Create failed", r.text)
        return None

    # List
    r = get(f"{BASE}/assets", token)
    if r.status_code == 200:
        assets = r.json()
        ok("Assets", f"List returned {len(assets)} asset(s)")
    else:
        fail("Assets", "List failed", r.text)

    # Search
    r = get(f"{BASE}/assets", token, params={"search": f"ASSET-{TS}"})
    if r.status_code == 200 and len(r.json()) >= 1:
        ok("Assets", "Search by asset tag works")
    else:
        fail("Assets", "Search failed", r.text)

    return asset_id

# ─────────────────────────────────────────────────────────────────────────────
# 7. TICKETS
# ─────────────────────────────────────────────────────────────────────────────
def test_tickets(token):
    print("\n[7] Tickets (Create / List / Update)")
    # Create
    r = post(f"{BASE}/tickets", {
        "title": f"Test ticket {TS} - Laptop not booting",
        "description": "The laptop shows a black screen on startup.",
        "priority": "high",
        "category": "hardware",
    }, token)
    if r.status_code == 200:
        ticket_id = r.json()["id"]
        ok("Tickets", f"Ticket created — id: {ticket_id[:8]}...")
    else:
        fail("Tickets", "Create failed", r.text)
        return None

    # List
    r = get(f"{BASE}/tickets", token)
    if r.status_code == 200:
        ok("Tickets", f"List returned {len(r.json())} ticket(s)")
    else:
        fail("Tickets", "List failed", r.text)

    # Update status
    r = patch(f"{BASE}/tickets/{ticket_id}", {"status": "in_progress"}, token)
    if r.status_code == 200 and r.json().get("status") == "in_progress":
        ok("Tickets", "Status updated to in_progress")
    else:
        fail("Tickets", "Status update failed", r.text)

    # Add comment
    r = post(f"{BASE}/tickets/{ticket_id}/comments", {"content": "Looking into this now."}, token)
    if r.status_code == 200:
        ok("Tickets", "Comment added to ticket")
    else:
        fail("Tickets", "Comment failed", r.text)

    return ticket_id

# ─────────────────────────────────────────────────────────────────────────────
# 8. ORDERS
# ─────────────────────────────────────────────────────────────────────────────
def test_orders(token, tenant_id, product_id):
    print("\n[8] Orders (Create / List)")
    r = post(f"{BASE}/orders", {
        "product_id": product_id,
        "quantity": 2,
        "tenant_id": tenant_id,
        "notes": "Needed for new joiners",
    }, token)
    if r.status_code == 200:
        order_id = r.json()["id"]
        ok("Orders", f"Order created — id: {order_id[:8]}...")
    else:
        fail("Orders", "Create failed", r.text)
        return None

    r = get(f"{BASE}/orders", token)
    if r.status_code == 200:
        ok("Orders", f"List returned {len(r.json())} order(s)")
    else:
        fail("Orders", "List failed", r.text)

    return order_id

# ─────────────────────────────────────────────────────────────────────────────
# 9. USERS
# ─────────────────────────────────────────────────────────────────────────────
def test_users(token, tenant_id):
    print("\n[9] Users (Create / List)")
    r = post(f"{BASE}/auth/register", {
        "email": f"employee.{TS}@alpha.com",
        "name": "Test Employee",
        "password": "Emp@1234",
        "role": "employee",
        "tenant_id": tenant_id,
    }, token)
    if r.status_code == 200:
        ok("Users", "Employee user registered under tenant")
    else:
        fail("Users", "Register failed", r.text)

    r = get(f"{BASE}/users", token)
    if r.status_code == 200:
        ok("Users", f"User list returned {len(r.json())} user(s)")
    else:
        fail("Users", "List failed", r.text)

# ─────────────────────────────────────────────────────────────────────────────
# 10. DEPARTMENTS
# ─────────────────────────────────────────────────────────────────────────────
def test_departments(token, tenant_id):
    print("\n[10] Departments (Create / List)")
    r = post(f"{BASE}/departments", {
        "name": f"IT Department {TS}",
        "description": "Information Technology",
        "tenant_id": tenant_id,
        "budget": 500000.0,
    }, token)
    if r.status_code == 200:
        ok("Departments", "Department created")
    else:
        fail("Departments", "Create failed", r.text)

    r = get(f"{BASE}/departments", token)
    if r.status_code == 200:
        ok("Departments", f"List returned {len(r.json())} department(s)")
    else:
        fail("Departments", "List failed", r.text)

# ─────────────────────────────────────────────────────────────────────────────
# 11. VENDORS
# ─────────────────────────────────────────────────────────────────────────────
def test_vendors(token, tenant_id):
    print("\n[11] Vendors (Create / List)")
    r = post(f"{BASE}/vendors", {
        "name": f"Dell India {TS}",
        "contact_name": "Sales Team",
        "email": f"sales.{TS}@dell.com",
        "phone": "9876543210",
        "category": "Hardware",
        "tenant_id": tenant_id,
    }, token)
    if r.status_code == 200:
        ok("Vendors", "Vendor created")
    else:
        fail("Vendors", "Create failed", r.text)

    r = get(f"{BASE}/vendors", token)
    if r.status_code == 200:
        ok("Vendors", f"List returned {len(r.json())} vendor(s)")
    else:
        fail("Vendors", "List failed", r.text)

# ─────────────────────────────────────────────────────────────────────────────
# 12. LOCATIONS
# ─────────────────────────────────────────────────────────────────────────────
def test_locations(token, tenant_id):
    print("\n[12] Locations (Create / List)")
    r = post(f"{BASE}/locations", {
        "name": f"Head Office {TS}",
        "building": "Tower A",
        "floor": "Floor 3",
        "room": "Room 301",
        "tenant_id": tenant_id,
    }, token)
    if r.status_code == 200:
        ok("Locations", "Location created")
    else:
        fail("Locations", "Create failed", r.text)

    r = get(f"{BASE}/locations", token)
    if r.status_code == 200:
        ok("Locations", f"List returned {len(r.json())} location(s)")
    else:
        fail("Locations", "List failed", r.text)

# ─────────────────────────────────────────────────────────────────────────────
# 13. LICENSES
# ─────────────────────────────────────────────────────────────────────────────
def test_licenses(token, tenant_id):
    print("\n[13] Software Licenses (Create / List)")
    expiry = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")
    r = post(f"{BASE}/licenses", {
        "name": f"Microsoft Office 365 {TS}",
        "vendor": "Microsoft",
        "license_key": f"XXXX-YYYY-ZZZZ-{TS}",
        "seats_total": 25,
        "seats_used": 10,
        "expiry_date": expiry,
        "cost": 15000.0,
        "tenant_id": tenant_id,
    }, token)
    if r.status_code == 200:
        ok("Licenses", f"License created — expires {expiry}")
    else:
        fail("Licenses", "Create failed", r.text)

    r = get(f"{BASE}/licenses", token)
    if r.status_code == 200:
        ok("Licenses", f"List returned {len(r.json())} license(s)")
    else:
        fail("Licenses", "List failed", r.text)

# ─────────────────────────────────────────────────────────────────────────────
# 14. TENANT DATA SEPARATION
# ─────────────────────────────────────────────────────────────────────────────
def test_data_separation():
    print("\n[14] Tenant Data Separation")

    # Create Tenant Beta
    ts2 = datetime.now().strftime("%H%M%S") + "B"
    r = requests.post(f"{BASE}/auth/signup", params={
        "company_name": f"Beta Corp {ts2}",
        "admin_name": "Beta Admin",
        "admin_email": f"beta.admin.{ts2}@beta.com",
        "admin_password": "Beta@1234",
        "domain": f"beta{ts2}.com",
        "subdomain": f"beta{ts2}",
        "currency": "INR",
    }, timeout=10)
    if r.status_code != 200:
        fail("Separation", "Could not create Beta tenant", r.text)
        return
    ok("Separation", "Beta tenant created")

    def quick_login(email, pwd):
        d = post(f"{BASE}/auth/login", {"email": email, "password": pwd}).json()
        return d.get("token") or d.get("access_token")

    beta_token = quick_login(f"beta.admin.{ts2}@beta.com", "Beta@1234")
    alpha_token = quick_login(f"alpha.admin.{TS}@alpha.com", "Alpha@1234")

    post(f"{BASE}/tickets", {"title": f"Alpha-only ticket {TS}", "description": "Alpha data", "priority": "low", "category": "general"}, alpha_token)
    post(f"{BASE}/tickets", {"title": f"Beta-only ticket {ts2}", "description": "Beta data", "priority": "low", "category": "general"}, beta_token)

    alpha_tickets = [t["title"] for t in get(f"{BASE}/tickets", alpha_token).json()]
    beta_tickets = [t["title"] for t in get(f"{BASE}/tickets", beta_token).json()]

    # Alpha should NOT see Beta's ticket
    if f"Beta-only ticket {ts2}" not in alpha_tickets:
        ok("Separation", "Alpha CANNOT see Beta's tickets")
    else:
        fail("Separation", "DATA LEAK — Alpha can see Beta's ticket!")

    # Beta should NOT see Alpha's ticket
    if f"Alpha-only ticket {TS}" not in beta_tickets:
        ok("Separation", "Beta CANNOT see Alpha's tickets")
    else:
        fail("Separation", "DATA LEAK — Beta can see Alpha's ticket!")

# ─────────────────────────────────────────────────────────────────────────────
# 15. AUDIT LOG
# ─────────────────────────────────────────────────────────────────────────────
def test_audit_log(token):
    print("\n[15] Audit Log")
    r = get(f"{BASE}/audit-log", token)
    if r.status_code == 200:
        ok("Audit Log", f"Audit log accessible — {len(r.json())} entries")
    else:
        fail("Audit Log", "Failed", r.text)

# ─────────────────────────────────────────────────────────────────────────────
# 16. RATE LIMITING
# ─────────────────────────────────────────────────────────────────────────────
def test_rate_limiting():
    print("\n[16] Rate Limiting (brute-force protection)")
    blocked = False
    for i in range(7):
        r = post(f"{BASE}/auth/login", {"email": "hacker@fake.com", "password": "wrongpass"})
        if r.status_code == 429:
            blocked = True
            break
    if blocked:
        ok("Rate Limiting", "Login blocked after repeated failures (429)")
    else:
        fail("Rate Limiting", "Not triggered after 7 bad attempts — brute force possible")

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def run():
    print()
    print("=" * 65)
    print("  FULL TEST SUITE — IT Asset Management App")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    test_health()
    tenant_id, email, password = test_signup()
    token = test_login(email, password, label="Alpha Admin")
    test_dashboard(token)
    product_id = test_products(token, tenant_id)
    if product_id:
        test_assets(token, tenant_id, product_id)
        test_orders(token, tenant_id, product_id)
    test_tickets(token)
    test_users(token, tenant_id)
    test_departments(token, tenant_id)
    test_vendors(token, tenant_id)
    test_locations(token, tenant_id)
    test_licenses(token, tenant_id)
    test_data_separation()
    test_audit_log(token)
    test_rate_limiting()

    total = PASS + FAIL
    print()
    print("=" * 65)
    print(f"  RESULTS: {PASS}/{total} passed")
    print()
    if FAILURES:
        print("  FAILED:")
        for f in FAILURES:
            print(f"    [FAIL] {f}")
    else:
        print("  ALL TESTS PASSED - App is ready for beta!")
    print("=" * 65)
    print()

    return FAIL == 0

if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
