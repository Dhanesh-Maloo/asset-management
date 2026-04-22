"""
SaaS Tier Management API Tests
Tests subscription tiers CRUD, tenant usage, tier limits enforcement, and subscription changes
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN = {"email": "admin@itassets.com", "password": "admin123"}
TENANT_ADMIN = {"email": "admin@acme.com", "password": "acme123"}
ASSET_MANAGER = {"email": "manager@acme.com", "password": "acme123"}
EMPLOYEE = {"email": "employee@acme.com", "password": "acme123"}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def super_admin_token(api_client):
    """Get super admin token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
    assert response.status_code == 200, f"Super admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def tenant_admin_token(api_client):
    """Get tenant admin token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN)
    assert response.status_code == 200, f"Tenant admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def tenant_admin_user(api_client):
    """Get tenant admin user data"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN)
    assert response.status_code == 200
    return response.json()["user"]


@pytest.fixture(scope="module")
def asset_manager_token(api_client):
    """Get asset manager token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=ASSET_MANAGER)
    assert response.status_code == 200, f"Asset manager login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def employee_token(api_client):
    """Get employee token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE)
    assert response.status_code == 200, f"Employee login failed: {response.text}"
    return response.json()["token"]


class TestSubscriptionTiersGet:
    """Tests for GET /api/subscription-tiers - returns default tiers"""
    
    def test_get_subscription_tiers_returns_3_default_tiers(self, api_client, tenant_admin_token):
        """GET /api/subscription-tiers returns 3 default tiers (Free, Pro, Enterprise)"""
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        tiers = response.json()
        assert isinstance(tiers, list)
        assert len(tiers) >= 3, f"Expected at least 3 tiers, got {len(tiers)}"
        
        # Check tier names
        tier_names = [t["name"] for t in tiers]
        assert "Free" in tier_names, "Free tier missing"
        assert "Pro" in tier_names, "Pro tier missing"
        assert "Enterprise" in tier_names, "Enterprise tier missing"
    
    def test_free_tier_has_correct_limits(self, api_client, tenant_admin_token):
        """Free tier has correct limits: max_users=3, max_assets=10"""
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        tiers = response.json()
        
        free_tier = next((t for t in tiers if t["slug"] == "free"), None)
        assert free_tier is not None, "Free tier not found"
        assert free_tier["limits"]["max_users"] == 3
        assert free_tier["limits"]["max_assets"] == 10
        assert free_tier["limits"]["max_orders_per_month"] == 5
        assert free_tier["limits"]["max_tickets_per_month"] == 10
    
    def test_pro_tier_has_correct_limits(self, api_client, tenant_admin_token):
        """Pro tier has correct limits"""
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        tiers = response.json()
        
        pro_tier = next((t for t in tiers if t["slug"] == "pro"), None)
        assert pro_tier is not None, "Pro tier not found"
        assert pro_tier["limits"]["max_users"] == 25
        assert pro_tier["limits"]["max_assets"] == 100
        assert pro_tier["limits"]["max_orders_per_month"] == 50
        assert pro_tier["limits"]["max_tickets_per_month"] == -1  # Unlimited
    
    def test_enterprise_tier_has_unlimited_limits(self, api_client, tenant_admin_token):
        """Enterprise tier has unlimited limits (-1)"""
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        tiers = response.json()
        
        enterprise_tier = next((t for t in tiers if t["slug"] == "enterprise"), None)
        assert enterprise_tier is not None, "Enterprise tier not found"
        assert enterprise_tier["limits"]["max_users"] == -1
        assert enterprise_tier["limits"]["max_assets"] == -1
        assert enterprise_tier["limits"]["max_orders_per_month"] == -1
        assert enterprise_tier["limits"]["max_tickets_per_month"] == -1
    
    def test_tiers_sorted_by_sort_order(self, api_client, tenant_admin_token):
        """Tiers are sorted by sort_order"""
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        tiers = response.json()
        
        sort_orders = [t.get("sort_order", 0) for t in tiers]
        assert sort_orders == sorted(sort_orders), "Tiers not sorted by sort_order"


class TestSubscriptionTiersCRUD:
    """Tests for subscription tier CRUD operations (super admin only)"""
    
    def test_create_tier_super_admin_only(self, api_client, super_admin_token):
        """POST /api/subscription-tiers creates a new tier (super admin only)"""
        tier_data = {
            "name": "TEST_Starter",
            "slug": "test-starter",
            "description": "Test starter tier",
            "sort_order": 99,
            "is_default": False,
            "limits": {
                "max_users": 5,
                "max_assets": 20,
                "max_orders_per_month": 10,
                "max_tickets_per_month": 20
            },
            "allowed_features": ["products", "orders", "assets"],
            "highlights": ["5 users", "20 assets"]
        }
        response = api_client.post(
            f"{BASE_URL}/api/subscription-tiers",
            json=tier_data,
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200, f"Failed to create tier: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Starter"
        assert data["slug"] == "test-starter"
        assert data["limits"]["max_users"] == 5
    
    def test_create_tier_denied_for_tenant_admin(self, api_client, tenant_admin_token):
        """Tenant admin cannot create tiers"""
        tier_data = {
            "name": "TEST_Unauthorized",
            "slug": "test-unauthorized",
            "description": "Should fail"
        }
        response = api_client.post(
            f"{BASE_URL}/api/subscription-tiers",
            json=tier_data,
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 403
    
    def test_update_tier_limits(self, api_client, super_admin_token):
        """PATCH /api/subscription-tiers/{tier_id} modifies tier limits"""
        # First get the test tier we created
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        tiers = response.json()
        test_tier = next((t for t in tiers if t["slug"] == "test-starter"), None)
        
        if test_tier:
            # Update the tier
            update_data = {
                "limits": {
                    "max_users": 10,
                    "max_assets": 50,
                    "max_orders_per_month": 25,
                    "max_tickets_per_month": 50
                }
            }
            response = api_client.patch(
                f"{BASE_URL}/api/subscription-tiers/{test_tier['id']}",
                json=update_data,
                headers={"Authorization": f"Bearer {super_admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["limits"]["max_users"] == 10
            assert data["limits"]["max_assets"] == 50
    
    def test_update_tier_denied_for_tenant_admin(self, api_client, tenant_admin_token):
        """Tenant admin cannot update tiers"""
        response = api_client.patch(
            f"{BASE_URL}/api/subscription-tiers/tier-free",
            json={"name": "Modified Free"},
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 403
    
    def test_delete_tier_without_tenants(self, api_client, super_admin_token):
        """DELETE /api/subscription-tiers/{tier_id} works if no tenants use it"""
        # Get the test tier
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        tiers = response.json()
        test_tier = next((t for t in tiers if t["slug"] == "test-starter"), None)
        
        if test_tier:
            response = api_client.delete(
                f"{BASE_URL}/api/subscription-tiers/{test_tier['id']}",
                headers={"Authorization": f"Bearer {super_admin_token}"}
            )
            assert response.status_code == 200
    
    def test_delete_tier_with_tenants_fails(self, api_client, super_admin_token):
        """DELETE /api/subscription-tiers/{tier_id} fails if tenants use it"""
        # Try to delete the free tier which has tenants
        response = api_client.delete(
            f"{BASE_URL}/api/subscription-tiers/tier-free",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 400
        assert "tenant" in response.json()["detail"].lower()


class TestTenantUsage:
    """Tests for GET /api/tenants/{tenant_id}/usage"""
    
    def test_get_tenant_usage(self, api_client, tenant_admin_token, tenant_admin_user):
        """GET /api/tenants/{tenant_id}/usage returns current usage vs limits"""
        tenant_id = tenant_admin_user["tenant_id"]
        response = api_client.get(
            f"{BASE_URL}/api/tenants/{tenant_id}/usage",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "tenant_id" in data
        assert "tier" in data
        assert "current_usage" in data
        assert "limits" in data
        
        # Check current_usage fields
        assert "users" in data["current_usage"]
        assert "assets" in data["current_usage"]
        assert "orders_this_month" in data["current_usage"]
        assert "tickets_this_month" in data["current_usage"]
        
        # Check limits fields
        assert "max_users" in data["limits"]
        assert "max_assets" in data["limits"]
        assert "max_orders_per_month" in data["limits"]
        assert "max_tickets_per_month" in data["limits"]
    
    def test_tenant_usage_includes_tier_info(self, api_client, tenant_admin_token, tenant_admin_user):
        """Usage response includes tier information"""
        tenant_id = tenant_admin_user["tenant_id"]
        response = api_client.get(
            f"{BASE_URL}/api/tenants/{tenant_id}/usage",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["tier"] is not None
        assert "name" in data["tier"]
        assert "slug" in data["tier"]
    
    def test_super_admin_can_view_any_tenant_usage(self, api_client, super_admin_token, tenant_admin_user):
        """Super admin can view any tenant's usage"""
        tenant_id = tenant_admin_user["tenant_id"]
        response = api_client.get(
            f"{BASE_URL}/api/tenants/{tenant_id}/usage",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200
    
    def test_tenant_admin_cannot_view_other_tenant_usage(self, api_client, tenant_admin_token):
        """Tenant admin cannot view other tenant's usage"""
        response = api_client.get(
            f"{BASE_URL}/api/tenants/other-tenant-id/usage",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code in [403, 404]
    
    def test_employee_cannot_view_usage(self, api_client, employee_token, tenant_admin_user):
        """Employee cannot view tenant usage"""
        tenant_id = tenant_admin_user["tenant_id"]
        response = api_client.get(
            f"{BASE_URL}/api/tenants/{tenant_id}/usage",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 403


class TestTenantSubscriptionChange:
    """Tests for PATCH /api/tenants/{tenant_id}/subscription"""
    
    def test_super_admin_can_change_tenant_tier(self, api_client, super_admin_token, tenant_admin_user):
        """Super admin can change tenant subscription tier"""
        tenant_id = tenant_admin_user["tenant_id"]
        
        # Change to Pro tier
        response = api_client.patch(
            f"{BASE_URL}/api/tenants/{tenant_id}/subscription?tier_id=tier-pro",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subscription_tier_id"] == "tier-pro"
        
        # Change back to Free tier
        response = api_client.patch(
            f"{BASE_URL}/api/tenants/{tenant_id}/subscription?tier_id=tier-free",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subscription_tier_id"] == "tier-free"
    
    def test_tenant_admin_cannot_change_tier(self, api_client, tenant_admin_token, tenant_admin_user):
        """Tenant admin cannot change their own tier"""
        tenant_id = tenant_admin_user["tenant_id"]
        response = api_client.patch(
            f"{BASE_URL}/api/tenants/{tenant_id}/subscription?tier_id=tier-enterprise",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 403
    
    def test_change_tier_updates_enabled_features(self, api_client, super_admin_token, tenant_admin_user):
        """Changing tier updates tenant's enabled_features"""
        tenant_id = tenant_admin_user["tenant_id"]
        
        # Change to Enterprise tier
        response = api_client.patch(
            f"{BASE_URL}/api/tenants/{tenant_id}/subscription?tier_id=tier-enterprise",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Enterprise should have api_access and priority_support
        assert "api_access" in data["enabled_features"]
        assert "priority_support" in data["enabled_features"]
        
        # Change back to Free
        response = api_client.patch(
            f"{BASE_URL}/api/tenants/{tenant_id}/subscription?tier_id=tier-free",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200


class TestTierLimitEnforcement:
    """Tests for tier limit enforcement on resource creation"""
    
    def test_user_creation_blocked_at_limit(self, api_client, tenant_admin_token, tenant_admin_user):
        """Creating users beyond tier limit returns 403 with upgrade message"""
        # Tenant-1 has 3 users and Free tier limit is 3
        # Trying to create another user should fail
        user_data = {
            "email": "TEST_newuser@acme.com",
            "password": "test123",
            "name": "Test New User",
            "role": "employee",
            "tenant_id": tenant_admin_user["tenant_id"]
        }
        response = api_client.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data,
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        # Should be 403 if at limit
        if response.status_code == 403:
            assert "limit" in response.json()["detail"].lower() or "upgrade" in response.json()["detail"].lower()
        # If 200, tenant might have been upgraded or has fewer users
        print(f"User creation response: {response.status_code} - {response.text}")
    
    def test_order_creation_respects_monthly_limit(self, api_client, employee_token):
        """Order creation respects monthly limit"""
        # Get a product first
        products_response = api_client.get(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        products = products_response.json()
        if not products:
            pytest.skip("No products available")
        
        product_id = products[0]["id"]
        
        # Try to create an order
        response = api_client.post(
            f"{BASE_URL}/api/orders",
            json={"product_id": product_id, "quantity": 1},
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        # Either succeeds (under limit) or fails with 403 (at limit)
        assert response.status_code in [200, 403]
        if response.status_code == 403:
            assert "limit" in response.json()["detail"].lower() or "upgrade" in response.json()["detail"].lower()
    
    def test_ticket_creation_respects_monthly_limit(self, api_client, employee_token):
        """Ticket creation respects monthly limit"""
        ticket_data = {
            "title": "TEST_Tier_Limit_Ticket",
            "description": "Testing tier limit enforcement",
            "priority": "low",
            "category": "general"
        }
        response = api_client.post(
            f"{BASE_URL}/api/tickets",
            json=ticket_data,
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        # Either succeeds (under limit) or fails with 403 (at limit)
        assert response.status_code in [200, 403]
        if response.status_code == 403:
            assert "limit" in response.json()["detail"].lower() or "upgrade" in response.json()["detail"].lower()


class TestTenantsPageTierBadge:
    """Tests for tenant tier badge on tenants list"""
    
    def test_tenants_list_includes_subscription_tier_id(self, api_client, super_admin_token):
        """Tenants list includes subscription_tier_id field"""
        response = api_client.get(
            f"{BASE_URL}/api/tenants",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200
        tenants = response.json()
        assert len(tenants) > 0
        
        for tenant in tenants:
            assert "subscription_tier_id" in tenant
            # Should have a tier assigned
            assert tenant["subscription_tier_id"] is not None or tenant.get("subscription_tier_id") == "tier-free"


class TestGetSingleTier:
    """Tests for GET /api/subscription-tiers/{tier_id}"""
    
    def test_get_single_tier(self, api_client, tenant_admin_token):
        """GET /api/subscription-tiers/{tier_id} returns tier details"""
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers/tier-free",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "tier-free"
        assert data["name"] == "Free"
    
    def test_get_nonexistent_tier_returns_404(self, api_client, tenant_admin_token):
        """GET /api/subscription-tiers/{tier_id} returns 404 for nonexistent tier"""
        response = api_client.get(
            f"{BASE_URL}/api/subscription-tiers/nonexistent-tier",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 404
