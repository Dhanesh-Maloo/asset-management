# IT Asset Management SaaS Platform - PRD

## Original Problem Statement
Build an IT asset ordering, management, assignment, retrieval, disposal app for a business focused on delivering IT as a service to GCC customers with multi-tenancy support, built-in helpdesk, product catalog.

## Core Architecture
- **Backend**: FastAPI + MongoDB (motor/asyncio)
- **Frontend**: React.js + TailwindCSS + Shadcn UI
- **Auth**: Hybrid JWT + Emergent-managed Google OAuth
- **Multi-tenancy**: Data isolation via `tenant_id`

## What's Been Implemented

### Core Features (DONE)
- Dashboard, Product Catalog (multi-currency), Orders (Maker-Checker-Approver), Assets, Helpdesk, Users, Groups, Approval Workflows, Tenants
- White-label branding per tenant, Customer signup, Google OAuth
- SaaS Tier Management (Free/Pro/Enterprise), feature gating, usage dashboards, limit enforcement
- Order confirmation dialog, sorting, price validation, stock deduction, Add Asset, Delete Group, Forgot Password, Assigned-To in tickets
- **Product catalog per tenant** — Tenant products segregated, global products visible to all
- **Bulk product import** — CSV/Excel file upload with validation and error reporting
- **Google OAuth fix** — Session endpoint returns JWT token, AuthCallback stores it

## Test Credentials
- Super Admin: admin@itassets.com / admin123
- Tenant Admin: admin@acme.com / acme123
- Asset Manager: manager@acme.com / acme123
- Employee: employee@acme.com / acme123

## Mocked APIs
- Currency conversion rates: hardcoded dict in server.py
- Password reset: token returned in API response (no email sent)

## 3rd Party Integrations
- Emergent-managed Google Auth (Authentication)

## Prioritized Backlog
### P1 - Third-Party Integrations
- Slack notifications & commands, Webhook system, API key management

### P2 - Helpdesk Sync & Reporting
- 2-way sync with Zendesk/Zoho Desk/Freshdesk/ServiceNow
- Asset lifecycle reports & analytics dashboard with charts
- Email notifications via SMTP

### P3 - Advanced Features
- Barcode/QR code scanning for asset checkouts/returns
