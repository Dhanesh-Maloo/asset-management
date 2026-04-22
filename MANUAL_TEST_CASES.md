# Manual Test Cases — Emergent Asset Management System
**Purpose:** Beta readiness testing  
**Date:** 2026-04-21  
**Tester:** ___________________  
**Build/URL:** ___________________

---

## HOW TO USE THIS DOCUMENT

- Work through each section in order
- Mark each test: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL
- Write notes in the "Result/Notes" column
- Screenshot any failures
- A feature is **beta-ready** when all CRITICAL tests pass

---

## TEST ACCOUNTS NEEDED BEFORE YOU START

Create these accounts/users before testing:

| Account | Role | Email | Password |
|---|---|---|---|
| Super Admin | super_admin | superadmin@test.com | (set during setup) |
| Tenant Admin | tenant_admin | admin@testorg.com | Test@1234 |
| Asset Manager | asset_manager | manager@testorg.com | Test@1234 |
| Helpdesk Agent | helpdesk_agent | helpdesk@testorg.com | Test@1234 |
| Employee | employee | employee@testorg.com | Test@1234 |

---

---

# MODULE 1: AUTHENTICATION

## TC-AUTH-01 — Email/Password Login (CRITICAL)
**Pre-condition:** App is running, valid user account exists  
**Steps:**
1. Open the app in your browser
2. You should see the Login page
3. Enter a valid email (e.g. `admin@testorg.com`)
4. Enter the correct password
5. Click the **Login** / **Sign In** button

**Expected Result:**
- Loading spinner appears briefly
- You are redirected to the **Dashboard** page
- Your name/role is shown in the top right or sidebar

**How to verify:** URL should change to `/dashboard`. Sidebar should show navigation links.

**Result/Notes:** ___________________

---

## TC-AUTH-02 — Wrong Password (CRITICAL)
**Steps:**
1. On the Login page
2. Enter a valid email
3. Enter a **wrong** password (e.g. `wrongpassword`)
4. Click Login

**Expected Result:**
- You stay on the Login page
- An error message appears (e.g. "Invalid credentials" or "Incorrect password")
- You are NOT logged in

**Result/Notes:** ___________________

---

## TC-AUTH-03 — Empty Fields Validation
**Steps:**
1. On the Login page
2. Leave email blank, enter a password, click Login
3. Then try: enter email, leave password blank, click Login
4. Then try: leave both blank, click Login

**Expected Result:**
- Each time an error appears (e.g. "Email is required")
- Form does not submit with empty fields

**Result/Notes:** ___________________

---

## TC-AUTH-04 — Forgot Password Flow
**Steps:**
1. On the Login page, click **Forgot Password**
2. Enter your email address
3. Click **Send Reset Link**
4. Check your email inbox
5. Click the reset link in the email
6. Enter a new password (and confirm it)
7. Submit
8. Try logging in with the new password

**Expected Result:**
- Step 3: "Check your email" confirmation message shown
- Step 5: Taken to a reset password page
- Step 7: "Password changed successfully" message
- Step 8: Login works with new password

**Result/Notes:** ___________________

---

## TC-AUTH-05 — Logout
**Steps:**
1. Log in successfully
2. Find the **Logout** button (usually in sidebar bottom or user menu top-right)
3. Click Logout

**Expected Result:**
- You are redirected to the Login page
- If you press the browser Back button, you should NOT see the dashboard (should redirect to login)

**Result/Notes:** ___________________

---

## TC-AUTH-06 — Direct URL Access Without Login
**Steps:**
1. Make sure you are logged out
2. Type directly in browser address bar: `<your-app-url>/dashboard`
3. Press Enter

**Expected Result:**
- You are redirected to the Login page
- Dashboard is NOT shown

**Result/Notes:** ___________________

---

## TC-AUTH-07 — Public Signup
**Steps:**
1. Go to the Login page
2. Click **Sign Up** or **Create Account**
3. Fill in: Name, Email, Password (e.g. `newuser@test.com` / `Test@5678`)
4. Submit the form

**Expected Result:**
- Account is created
- You are logged in OR redirected to login with a success message

**Result/Notes:** ___________________

---

---

# MODULE 2: DASHBOARD

## TC-DASH-01 — Dashboard Loads (CRITICAL)
**Steps:**
1. Log in as Tenant Admin
2. You should be on the Dashboard

**Expected Result:**
- Page loads without errors
- You see summary cards (e.g. Total Assets, Available, Assigned, Open Tickets, Pending Orders)
- Numbers in cards are visible (can be 0 if no data yet)
- Charts/graphs section is visible

**Result/Notes:** ___________________

---

## TC-DASH-02 — Dashboard Numbers Match Reality
**Steps:**
1. Note down the numbers shown on the Dashboard (e.g. "Total Assets: 5")
2. Go to the Assets page and count the assets
3. Return to Dashboard and compare

**Expected Result:**
- Dashboard stats match actual counts

**Result/Notes:** ___________________

---

---

# MODULE 3: PRODUCTS

## TC-PROD-01 — View Product List
**Steps:**
1. Log in as Asset Manager
2. Click **Products** in the sidebar

**Expected Result:**
- Products page loads
- If products exist, they are listed (name, category, price, stock)
- If no products yet, a "No products" message or empty state shown

**Result/Notes:** ___________________

---

## TC-PROD-02 — Create a New Product (CRITICAL)
**Steps:**
1. On the Products page, click **Add Product** or **New Product** button
2. Fill in:
   - Name: `Test Laptop`
   - Category: `Hardware` (or any category)
   - Description: `Test description`
   - Price: `50000`
   - Quantity: `10`
3. Click **Save** or **Create**

**Expected Result:**
- Product appears in the list
- Name, price, and quantity are correct

**Result/Notes:** ___________________

---

## TC-PROD-03 — Search Products
**Steps:**
1. On the Products page, type `Test Laptop` in the search box

**Expected Result:**
- Only products matching "Test Laptop" are shown
- Other products are filtered out

**Result/Notes:** ___________________

---

## TC-PROD-04 — Delete a Product
**Steps:**
1. On the Products page, find the product you created (Test Laptop)
2. Click the **Delete** button (trash icon or delete option)
3. Confirm the deletion if a popup appears

**Expected Result:**
- Product is removed from the list
- Confirmation message shown

**Result/Notes:** ___________________

---

---

# MODULE 4: ASSETS

## TC-ASSET-01 — View Asset List
**Steps:**
1. Log in as Asset Manager
2. Click **Assets** in the sidebar

**Expected Result:**
- Assets page loads
- Assets are listed (or empty state if none)
- Each asset shows: tag number, name, status, location

**Result/Notes:** ___________________

---

## TC-ASSET-02 — Create a New Asset (CRITICAL)
**Steps:**
1. On the Assets page, click **Add Asset** or **New Asset**
2. Fill in:
   - Asset Tag: `ASSET-001`
   - Name: `Dell Laptop`
   - Serial Number: `SN123456`
   - Status: `Available`
   - Purchase Price: `45000`
   - Purchase Date: (today's date)
   - Department: (select any department)
   - Location: (select any location)
3. Click **Save**

**Expected Result:**
- Asset appears in the list with status "Available"
- Asset tag ASSET-001 is shown

**Result/Notes:** ___________________

---

## TC-ASSET-03 — Assign Asset to a User (CRITICAL)
**Steps:**
1. Find the asset `ASSET-001` (Dell Laptop)
2. Click the **Assign** button
3. Search for and select a user (e.g. employee@testorg.com)
4. Click **Confirm** or **Assign**

**Expected Result:**
- Asset status changes to **Assigned** or **In Use**
- The assigned user's name is shown on the asset

**Result/Notes:** ___________________

---

## TC-ASSET-04 — View Asset Detail
**Steps:**
1. Click on an asset name or a "View" button to open the detail page

**Expected Result:**
- Asset detail page opens
- Shows all info: tag, serial number, status, assigned user, purchase info, warranty, depreciation value

**Result/Notes:** ___________________

---

## TC-ASSET-05 — Update Asset Status
**Steps:**
1. Find an asset
2. Change its status (e.g. from Available → Under Maintenance)
3. Save

**Expected Result:**
- Status updates successfully
- New status is reflected in the list

**Result/Notes:** ___________________

---

## TC-ASSET-06 — Search and Filter Assets
**Steps:**
1. On the Assets page, type a name in the search box
2. Also try filtering by Status (e.g. show only "Available")
3. Try filtering by Department

**Expected Result:**
- Search returns matching assets only
- Status filter shows only assets with that status
- Department filter works correctly

**Result/Notes:** ___________________

---

## TC-ASSET-07 — Export Assets to CSV
**Steps:**
1. On the Assets page, look for an **Export** or **Download CSV** button
2. Click it

**Expected Result:**
- A CSV file is downloaded to your computer
- Opening the file in Excel shows asset data with correct columns

**Result/Notes:** ___________________

---

## TC-ASSET-08 — Asset Checkout and Return
**Steps:**
1. Find an "Available" asset
2. Click **Checkout** button
3. Select a user and set an expected return date
4. Save
5. Then find the checked-out asset, click **Return**
6. Add return notes (e.g. "Good condition")
7. Save

**Expected Result:**
- Step 4: Status changes to `checked_out`
- Step 7: Status reverts to `Available`, return recorded

**Result/Notes:** ___________________

---

## TC-ASSET-09 — Depreciation Calculation
**Steps:**
1. Create an asset with:
   - Purchase Price: `100000`
   - Depreciation Method: `Straight Line`
   - Useful Life: `5 years` (if field available)
2. View the asset detail page

**Expected Result:**
- A "Current Value" or depreciation figure is shown
- The value is less than purchase price (depreciated over time)

**Result/Notes:** ___________________

---

## TC-ASSET-10 — Bulk Update Assets
**Steps:**
1. On the Assets page, select 2-3 assets using checkboxes
2. Look for a **Bulk Update** or **Bulk Actions** option
3. Change their status or location together
4. Save

**Expected Result:**
- All selected assets are updated with the new status/location

**Result/Notes:** ___________________

---

---

# MODULE 5: ORDERS

## TC-ORDER-01 — Create an Order (CRITICAL)
**Steps:**
1. Log in as **Employee**
2. Click **Orders** in the sidebar
3. Click **New Order** or **Create Order**
4. Select a product from the catalog
5. Enter quantity: `2`
6. Add delivery notes: `Needed for new joiner`
7. Submit the order

**Expected Result:**
- Order is created with status **Pending**
- Order appears in the list

**Result/Notes:** ___________________

---

## TC-ORDER-02 — Checker Approves Order
**Steps:**
1. Log in as **Asset Manager** (or the assigned checker role)
2. Go to **Orders**
3. Find the pending order from TC-ORDER-01
4. Click **Approve** (checker level)
5. Add a comment if asked

**Expected Result:**
- Order status moves from Pending → next stage (e.g. "Checker Approved" or still "Pending" waiting for final approval)

**Result/Notes:** ___________________

---

## TC-ORDER-03 — Final Approver Approves Order
**Steps:**
1. Log in as **Tenant Admin**
2. Go to **Orders**
3. Find the order
4. Click **Final Approve**

**Expected Result:**
- Order status changes to **Approved**

**Result/Notes:** ___________________

---

## TC-ORDER-04 — Reject an Order
**Steps:**
1. Log in as Asset Manager or Admin
2. Find a pending order
3. Click **Reject**
4. Enter rejection reason: `Out of budget`
5. Confirm

**Expected Result:**
- Order status changes to **Rejected**
- Rejection reason is visible

**Result/Notes:** ___________________

---

## TC-ORDER-05 — Export Orders to CSV
**Steps:**
1. On the Orders page, click **Export** or **Download CSV**

**Expected Result:**
- CSV file downloads with order data

**Result/Notes:** ___________________

---

---

# MODULE 6: TICKETS (HELPDESK)

## TC-TICKET-01 — Create a Support Ticket (CRITICAL)
**Steps:**
1. Log in as **Employee**
2. Click **Tickets** in the sidebar
3. Click **New Ticket** or **Create Ticket**
4. Fill in:
   - Title: `Laptop not turning on`
   - Description: `My assigned laptop ASSET-001 does not power on`
   - Priority: `High`
   - Category: `Technical`
5. Submit

**Expected Result:**
- Ticket is created with status **Open**
- Ticket appears in the list with correct priority

**Result/Notes:** ___________________

---

## TC-TICKET-02 — Assign Ticket to Helpdesk Agent
**Steps:**
1. Log in as **Helpdesk Agent** or **Admin**
2. Go to Tickets
3. Open the ticket created above
4. Assign it to a helpdesk agent user
5. Change status to **In Progress**

**Expected Result:**
- Ticket shows assigned agent's name
- Status is "In Progress"

**Result/Notes:** ___________________

---

## TC-TICKET-03 — Add Comment to Ticket
**Steps:**
1. Open any ticket
2. Find the **Comments** section at the bottom
3. Type a comment: `I will check the power cable first`
4. Submit the comment

**Expected Result:**
- Comment appears under the ticket
- Comment shows your name and timestamp

**Result/Notes:** ___________________

---

## TC-TICKET-04 — Resolve and Close Ticket
**Steps:**
1. Open the "In Progress" ticket
2. Change status to **Resolved**
3. Save
4. Then change to **Closed**

**Expected Result:**
- Status updates correctly at each step

**Result/Notes:** ___________________

---

## TC-TICKET-05 — Filter Tickets by Status
**Steps:**
1. On the Tickets page, use the filter to show only **Open** tickets
2. Then filter for **Resolved** tickets

**Expected Result:**
- Only tickets with matching status are shown

**Result/Notes:** ___________________

---

## TC-TICKET-06 — Bulk Delete Tickets
**Steps:**
1. Create 2-3 test tickets
2. Select them using checkboxes
3. Click **Bulk Delete**
4. Confirm

**Expected Result:**
- All selected tickets are deleted

**Result/Notes:** ___________________

---

---

# MODULE 7: RESERVATIONS

## TC-RES-01 — Create Asset Reservation (CRITICAL)
**Steps:**
1. Log in as **Employee**
2. Click **Reservations** in the sidebar
3. Click **New Reservation**
4. Select an asset
5. Set start date: tomorrow's date
6. Set end date: 3 days from now
7. Add purpose: `Client presentation`
8. Submit

**Expected Result:**
- Reservation is created with status **Pending**

**Result/Notes:** ___________________

---

## TC-RES-02 — Approve a Reservation
**Steps:**
1. Log in as **Asset Manager** or **Admin**
2. Go to Reservations
3. Find the pending reservation
4. Click **Approve**

**Expected Result:**
- Reservation status changes to **Approved**

**Result/Notes:** ___________________

---

## TC-RES-03 — Reject a Reservation
**Steps:**
1. Create another test reservation
2. Log in as admin/manager
3. Click **Reject** on the reservation

**Expected Result:**
- Status changes to **Rejected**

**Result/Notes:** ___________________

---

## TC-RES-04 — Cancel a Reservation
**Steps:**
1. Log in as the Employee who created a reservation
2. Find a Pending or Approved reservation
3. Click **Cancel**

**Expected Result:**
- Reservation status changes to **Cancelled**

**Result/Notes:** ___________________

---

---

# MODULE 8: DEPARTMENTS

## TC-DEPT-01 — Create a Department (CRITICAL)
**Steps:**
1. Log in as **Tenant Admin**
2. Click **Departments** in the sidebar
3. Click **New Department** or **Add**
4. Fill in:
   - Name: `Information Technology`
   - Budget: `500000`
5. Save

**Expected Result:**
- Department appears in list with the name and budget

**Result/Notes:** ___________________

---

## TC-DEPT-02 — Edit a Department
**Steps:**
1. Find the IT department
2. Click **Edit** (pencil icon)
3. Change budget to `600000`
4. Save

**Expected Result:**
- Budget updates to 600000

**Result/Notes:** ___________________

---

## TC-DEPT-03 — Delete a Department
**Steps:**
1. Create a test department (e.g. "Delete Me Dept")
2. Click **Delete**
3. Confirm

**Expected Result:**
- Department is removed from the list

**Result/Notes:** ___________________

---

---

# MODULE 9: LOCATIONS

## TC-LOC-01 — Create a Location (CRITICAL)
**Steps:**
1. Log in as Admin or Asset Manager
2. Click **Locations** in the sidebar
3. Click **New Location** or **Add**
4. Fill in:
   - Building: `HQ Building`
   - Floor: `2nd Floor`
   - Room: `Server Room`
5. Save

**Expected Result:**
- Location appears in the list

**Result/Notes:** ___________________

---

## TC-LOC-02 — Edit and Delete a Location
**Steps:**
1. Click **Edit** on HQ Building location, change room to `IT Room`, save
2. Create a new "Test Location", then delete it

**Expected Result:**
- Edit saves correctly
- Delete removes the location

**Result/Notes:** ___________________

---

---

# MODULE 10: VENDORS

## TC-VEND-01 — Create a Vendor (CRITICAL)
**Steps:**
1. Log in as Admin or Asset Manager
2. Click **Vendors** in sidebar
3. Click **New Vendor**
4. Fill in:
   - Name: `Dell Technologies`
   - Contact Name: `Rajesh Kumar`
   - Email: `rajesh@dell.com`
   - Phone: `9876543210`
   - Category: `Hardware`
5. Save

**Expected Result:**
- Vendor appears in the list

**Result/Notes:** ___________________

---

## TC-VEND-02 — Edit and Delete a Vendor
**Steps:**
1. Edit Dell Technologies — change phone number, save
2. Create a test vendor, then delete it

**Expected Result:**
- Edit saves correctly
- Delete removes vendor

**Result/Notes:** ___________________

---

---

# MODULE 11: LICENSES

## TC-LIC-01 — Create a License (CRITICAL)
**Steps:**
1. Log in as Admin or Asset Manager
2. Click **Licenses** in sidebar
3. Click **New License**
4. Fill in:
   - Software Name: `Microsoft Office 365`
   - License Type: `Subscription`
   - Total Seats: `50`
   - Used Seats: `30`
   - Expiry Date: (6 months from today)
   - Cost: `150000`
5. Save

**Expected Result:**
- License appears in the list with seats and expiry info

**Result/Notes:** ___________________

---

## TC-LIC-02 — Edit and Delete a License
**Steps:**
1. Edit the license — change Used Seats to `35`, save
2. Create a test license, then delete it

**Expected Result:**
- Edit saves correctly
- Delete works

**Result/Notes:** ___________________

---

---

# MODULE 12: REPORTS

## TC-RPT-01 — Assets by Department Report
**Steps:**
1. Log in as Admin or Asset Manager
2. Click **Reports** in sidebar
3. Select **Assets by Department**
4. Click **Generate** or wait for it to load

**Expected Result:**
- A bar chart or table appears showing number of assets per department
- Data matches actual asset assignments

**Result/Notes:** ___________________

---

## TC-RPT-02 — Maintenance Costs Report
**Steps:**
1. On Reports page, select **Maintenance Costs**
2. Set a date range (e.g. last 30 days)
3. Generate report

**Expected Result:**
- Report shows cost breakdown for maintenance activities

**Result/Notes:** ___________________

---

## TC-RPT-03 — Expiring Warranties Report
**Steps:**
1. On Reports page, select **Expiring Warranties**
2. Set alert window to `90 days`
3. Generate

**Expected Result:**
- All assets with warranties expiring within 90 days are listed

**Result/Notes:** ___________________

---

## TC-RPT-04 — Asset Depreciation Report
**Steps:**
1. Select **Asset Depreciation** report
2. Generate

**Expected Result:**
- Report shows current vs purchase value for each asset with depreciation method

**Result/Notes:** ___________________

---

---

# MODULE 13: USERS MANAGEMENT

## TC-USER-01 — View All Users (CRITICAL)
**Steps:**
1. Log in as **Tenant Admin**
2. Click **Users** in sidebar

**Expected Result:**
- List of all users in the tenant is shown
- Each user shows: name, email, role, status

**Result/Notes:** ___________________

---

## TC-USER-02 — Create a New User
**Steps:**
1. On the Users page, click **New User** or **Add User**
2. Fill in:
   - Name: `Test Employee`
   - Email: `testemployee@testorg.com`
   - Role: `employee`
   - Password: `Test@9999`
3. Save

**Expected Result:**
- New user appears in the list with role "employee"

**Result/Notes:** ___________________

---

## TC-USER-03 — Role-Based Access Verification (CRITICAL)
**Steps:**
1. Log in as the new **Employee** user
2. Check the sidebar navigation

**Expected Result:**
- Employee can see: Dashboard, Products, Orders, Tickets, Reservations, Profile
- Employee CANNOT see: Users, Groups, Departments, Workflows, Reports, Activity
- If they manually type `/users` in the URL, they should be blocked/redirected

**Result/Notes:** ___________________

---

---

# MODULE 14: GROUPS

## TC-GRP-01 — Create a User Group
**Steps:**
1. Log in as Tenant Admin
2. Click **Groups** in sidebar
3. Click **New Group**
4. Fill in:
   - Name: `IT Support Group`
   - Type: `user_group`
5. Save

**Expected Result:**
- Group is created and listed

**Result/Notes:** ___________________

---

## TC-GRP-02 — Assign Permissions to Group
**Steps:**
1. Open the IT Support Group
2. Look for permissions panel
3. Enable permissions like: `view_assets`, `manage_tickets`
4. Save

**Expected Result:**
- Permissions are saved for the group

**Result/Notes:** ___________________

---

---

# MODULE 15: APPROVAL WORKFLOWS

## TC-WF-01 — Create an Approval Workflow
**Steps:**
1. Log in as Tenant Admin
2. Click **Workflows** in sidebar
3. Click **New Workflow**
4. Fill in:
   - Entity Type: `Order`
   - Threshold: `10000` (orders above 10,000 need approval)
   - Checker Group: (select a group)
   - Approver Group: (select admin group)
5. Save

**Expected Result:**
- Workflow appears in the list

**Result/Notes:** ___________________

---

## TC-WF-02 — Verify Workflow Triggers on Orders
**Steps:**
1. Create an order with a value **above** the threshold (e.g. product worth 15,000, qty 1)
2. Submit it as Employee

**Expected Result:**
- Order requires approval from checker and then approver
- Order does not auto-approve

**Result/Notes:** ___________________

---

---

# MODULE 16: TENANT SETTINGS

## TC-TENANT-01 — Update Tenant Branding
**Steps:**
1. Log in as Tenant Admin
2. Click **Settings** or **Tenant Settings** in sidebar
3. Change:
   - Company Name: `TestOrg Inc.`
   - Primary Color: (pick a different color)
4. Save

**Expected Result:**
- Company name updates
- Color change reflects in the UI (sidebar/header may change color)

**Result/Notes:** ___________________

---

## TC-TENANT-02 — Enable/Disable Features
**Steps:**
1. In Tenant Settings, find the feature toggles
2. Turn OFF a feature (e.g. Reservations)
3. Save
4. Check the sidebar

**Expected Result:**
- Reservations option disappears from the sidebar when disabled

**Result/Notes:** ___________________

---

---

# MODULE 17: PROFILE

## TC-PROF-01 — View and Edit Profile
**Steps:**
1. Log in as any user
2. Click your name or **Profile** in the sidebar
3. Update your display name
4. Save

**Expected Result:**
- Name is updated and shown correctly

**Result/Notes:** ___________________

---

## TC-PROF-02 — Change Password
**Steps:**
1. On the Profile page, find **Change Password**
2. Enter current password
3. Enter new password: `NewPass@2026`
4. Confirm new password
5. Save
6. Log out and log in with the new password

**Expected Result:**
- Step 5: "Password changed" confirmation
- Step 6: Login works with new password

**Result/Notes:** ___________________

---

## TC-PROF-03 — Wrong Current Password Rejected
**Steps:**
1. On Change Password, enter a wrong current password
2. Enter new password
3. Submit

**Expected Result:**
- Error: "Current password is incorrect" (or similar)
- Password is NOT changed

**Result/Notes:** ___________________

---

---

# MODULE 18: ACTIVITY FEED

## TC-ACT-01 — View Activity Log
**Steps:**
1. Log in as Admin
2. Click **Activity** in sidebar

**Expected Result:**
- A chronological log of actions is shown
- Each entry shows: who did what, when (e.g. "admin@testorg.com created asset ASSET-001")

**Result/Notes:** ___________________

---

---

# MODULE 19: SUBSCRIPTION (ADMIN)

## TC-SUB-01 — View Subscription Info
**Steps:**
1. Log in as Tenant Admin
2. Click **Subscription** in sidebar

**Expected Result:**
- Current plan/tier is shown
- Usage stats visible (e.g. "10/100 assets used", "5/50 users")

**Result/Notes:** ___________________

---

---

# MODULE 20: SUPER ADMIN FUNCTIONS

## TC-SA-01 — View All Tenants
**Steps:**
1. Log in as **Super Admin**
2. Click **Tenants** in sidebar

**Expected Result:**
- All tenants are listed
- Can view each tenant's details

**Result/Notes:** ___________________

---

## TC-SA-02 — Manage Subscription Tiers
**Steps:**
1. Log in as Super Admin
2. Click **Tier Management** in sidebar
3. View existing tiers (Free, Pro, Enterprise)
4. Edit one tier — change a limit (e.g. max users)
5. Save

**Expected Result:**
- Tier updates successfully

**Result/Notes:** ___________________

---

---

# MODULE 21: CROSS-BROWSER TESTING

Test the following in each browser you plan to support:

| Feature | Chrome | Firefox | Edge | Mobile (Chrome) |
|---|---|---|---|---|
| Login | | | | |
| Dashboard loads | | | | |
| Create Asset | | | | |
| Create Ticket | | | | |
| Sidebar navigation | | | | |
| Tables/lists display | | | | |

---

---

# MODULE 22: EDGE CASES & NEGATIVE TESTS

## TC-EDGE-01 — Duplicate Asset Tag
**Steps:**
1. Create an asset with tag `ASSET-DUPE`
2. Try to create another asset with the same tag `ASSET-DUPE`

**Expected Result:**
- Error message: "Asset tag already exists" (or similar)
- Duplicate is NOT created

**Result/Notes:** ___________________

---

## TC-EDGE-02 — Very Long Text Input
**Steps:**
1. In any text field (e.g. asset name), paste 500+ characters of text
2. Try to save

**Expected Result:**
- Either the field has a character limit and stops input, OR
- Validation error is shown, OR
- It saves but truncates cleanly — it should NOT crash

**Result/Notes:** ___________________

---

## TC-EDGE-03 — Invalid Email Format
**Steps:**
1. On signup or user creation, enter invalid email: `notanemail`
2. Submit

**Expected Result:**
- Validation error: "Invalid email format"

**Result/Notes:** ___________________

---

## TC-EDGE-04 — Negative Numbers in Price/Quantity
**Steps:**
1. When creating a product or asset, enter `-100` as price
2. Submit

**Expected Result:**
- Validation error: "Price must be positive" or similar
- Negative value NOT saved

**Result/Notes:** ___________________

---

## TC-EDGE-05 — Delete in Use Asset
**Steps:**
1. Assign an asset to a user (so it's "In Use")
2. Try to delete that asset

**Expected Result:**
- Either: Error prevents deletion ("Asset is currently assigned")
- Or: Deletion is allowed but assignment is cleared — note what happens

**Result/Notes:** ___________________

---

## TC-EDGE-06 — Session Timeout
**Steps:**
1. Log in to the app
2. Leave it idle for a long time (check if there's a session timeout setting)
3. Try to perform an action

**Expected Result:**
- If session expires, you're redirected to login
- You should NOT see an unhandled error

**Result/Notes:** ___________________

---

---

# MODULE 23: PERFORMANCE CHECKS

## TC-PERF-01 — Page Load Time
**Steps:**
1. For each major page, note the time it takes to load (use browser DevTools → Network tab)

| Page | Load Time | Acceptable? (<3 sec) |
|---|---|---|
| Login | | |
| Dashboard | | |
| Assets (list) | | |
| Products (list) | | |
| Tickets (list) | | |
| Reports | | |

**Result/Notes:** ___________________

---

## TC-PERF-02 — Large Data Sets
**Steps:**
1. If possible, import 50+ assets using bulk import (CSV)
2. Load the Assets page
3. Try searching and filtering

**Expected Result:**
- Page still loads within 5 seconds
- Search/filter still works correctly
- No browser freeze

**Result/Notes:** ___________________

---

---

# FINAL SIGN-OFF CHECKLIST

Before handing to beta users, confirm these are ALL passing:

| # | Check | Status |
|---|---|---|
| 1 | User can register and login | |
| 2 | Role-based access working (employee can't see admin pages) | |
| 3 | Dashboard shows real stats | |
| 4 | Can create, view, assign, and update assets | |
| 5 | Can place and approve an order | |
| 6 | Can create and resolve support tickets | |
| 7 | Can add departments, locations, vendors | |
| 8 | Logout works and session is cleared | |
| 9 | No broken pages (check browser console for red errors) | |
| 10 | CSV export downloads correctly | |
| 11 | App works on Chrome and mobile | |
| 12 | Password change works securely | |

---

## HOW TO REPORT A BUG

For each bug found, document:
1. **Test Case ID** (e.g. TC-ASSET-03)
2. **What you did** (steps)
3. **What you expected**
4. **What actually happened**
5. **Screenshot** (if possible)
6. **Browser + OS** (e.g. Chrome on Windows 11)

---

*Document generated for beta testing — Emergent Asset Management System*
