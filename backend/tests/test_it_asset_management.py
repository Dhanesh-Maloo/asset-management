"""
IT Asset Management API Tests
Tests authentication, RBAC, assets, products, orders, tickets, and multi-tenancy
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


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_super_admin_login(self, api_client):
        """Test super admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["email"] == "admin@itassets.com"
    
    def test_tenant_admin_login(self, api_client):
        """Test tenant admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "tenant_admin"
        assert data["user"]["tenant_id"] == "tenant-1"
    
    def test_asset_manager_login(self, api_client):
        """Test asset manager login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=ASSET_MANAGER)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "asset_manager"
        assert data["user"]["email"] == "manager@acme.com"
    
    def test_employee_login(self, api_client):
        """Test employee login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "employee"
    
    def test_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
    
    def test_auth_me_endpoint(self, api_client, asset_manager_token):
        """Test /auth/me endpoint with JWT token"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {asset_manager_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "manager@acme.com"
        assert data["role"] == "asset_manager"


class TestAssetManagerBugFix:
    """Tests for the Asset Manager bug fix - accessing /api/users endpoint"""
    
    def test_asset_manager_can_access_users(self, api_client, asset_manager_token):
        """CRITICAL: Asset Manager should be able to access /api/users (bug fix verification)"""
        response = api_client.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {asset_manager_token}"}
        )
        assert response.status_code == 200, f"Asset Manager should access /api/users but got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # Should only see users from same tenant
        for user in data:
            assert user["tenant_id"] == "tenant-1"
    
    def test_asset_manager_can_access_assets(self, api_client, asset_manager_token):
        """Asset Manager should be able to access /api/assets"""
        response = api_client.get(
            f"{BASE_URL}/api/assets",
            headers={"Authorization": f"Bearer {asset_manager_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should only see assets from same tenant
        for asset in data:
            assert asset["tenant_id"] == "tenant-1"


class TestDashboard:
    """Dashboard stats endpoint tests"""
    
    def test_super_admin_dashboard_stats(self, api_client, super_admin_token):
        """Super admin sees all stats including tenants and users"""
        response = api_client.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_assets" in data
        assert "total_tenants" in data
        assert "total_users" in data
    
    def test_tenant_admin_dashboard_stats(self, api_client, tenant_admin_token):
        """Tenant admin sees tenant-scoped stats"""
        response = api_client.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_assets" in data
        assert "open_tickets" in data
        assert "pending_orders" in data
    
    def test_asset_manager_dashboard_stats(self, api_client, asset_manager_token):
        """Asset manager sees tenant-scoped stats"""
        response = api_client.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {asset_manager_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_assets" in data


class TestProducts:
    """Product catalog endpoint tests"""
    
    def test_get_products(self, api_client, tenant_admin_token):
        """Get all products"""
        response = api_client.get(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_get_products_with_currency(self, api_client, tenant_admin_token):
        """Get products with currency conversion"""
        response = api_client.get(
            f"{BASE_URL}/api/products?currency=INR",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        # INR prices should be higher than USD
        assert data[0]["display_currency"] == "INR"
    
    def test_create_product_as_admin(self, api_client, tenant_admin_token):
        """Tenant admin can create products"""
        product_data = {
            "name": "TEST_Product_Admin",
            "category": "Test",
            "description": "Test product created by admin",
            "price": 99.99,
            "stock": 10
        }
        response = api_client.post(
            f"{BASE_URL}/api/products",
            json=product_data,
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Product_Admin"
    
    def test_create_product_as_asset_manager(self, api_client, asset_manager_token):
        """Asset manager can create products"""
        product_data = {
            "name": "TEST_Product_Manager",
            "category": "Test",
            "description": "Test product created by asset manager",
            "price": 49.99,
            "stock": 5
        }
        response = api_client.post(
            f"{BASE_URL}/api/products",
            json=product_data,
            headers={"Authorization": f"Bearer {asset_manager_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Product_Manager"


class TestOrders:
    """Order endpoint tests"""
    
    def test_employee_create_order(self, api_client, employee_token):
        """Employee can create orders"""
        # First get a product
        products_response = api_client.get(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        products = products_response.json()
        product_id = products[0]["id"]
        
        response = api_client.post(
            f"{BASE_URL}/api/orders",
            json={"product_id": product_id, "quantity": 1},
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        assert data["product_id"] == product_id
    
    def test_get_orders_as_employee(self, api_client, employee_token):
        """Employee sees only their orders"""
        response = api_client.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_orders_as_admin(self, api_client, tenant_admin_token):
        """Admin sees all tenant orders"""
        response = api_client.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAssets:
    """Asset management endpoint tests"""
    
    def test_get_assets_as_admin(self, api_client, tenant_admin_token):
        """Admin can get all tenant assets"""
        response = api_client.get(
            f"{BASE_URL}/api/assets",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_get_assets_as_employee(self, api_client, employee_token):
        """Employee sees only assigned assets"""
        response = api_client.get(
            f"{BASE_URL}/api/assets",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_asset_depreciation(self, api_client, tenant_admin_token):
        """Get asset depreciation calculation"""
        # First get an asset
        assets_response = api_client.get(
            f"{BASE_URL}/api/assets",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assets = assets_response.json()
        asset_id = assets[0]["id"]
        
        response = api_client.get(
            f"{BASE_URL}/api/assets/{asset_id}/depreciation",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "current_value" in data


class TestTickets:
    """Helpdesk ticket endpoint tests"""
    
    def test_create_ticket(self, api_client, employee_token):
        """Employee can create tickets"""
        ticket_data = {
            "title": "TEST_Ticket",
            "description": "Test ticket description",
            "priority": "medium",
            "category": "general"
        }
        response = api_client.post(
            f"{BASE_URL}/api/tickets",
            json=ticket_data,
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Ticket"
        assert data["status"] == "open"
    
    def test_get_tickets_as_employee(self, api_client, employee_token):
        """Employee sees only their tickets"""
        response = api_client.get(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_tickets_as_admin(self, api_client, tenant_admin_token):
        """Admin sees all tenant tickets"""
        response = api_client.get(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestUsers:
    """User management endpoint tests"""
    
    def test_super_admin_get_all_users(self, api_client, super_admin_token):
        """Super admin can get all users"""
        response = api_client.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_tenant_admin_get_tenant_users(self, api_client, tenant_admin_token):
        """Tenant admin sees only tenant users"""
        response = api_client.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for user in data:
            assert user["tenant_id"] == "tenant-1"
    
    def test_employee_cannot_access_users(self, api_client, employee_token):
        """Employee cannot access users endpoint"""
        response = api_client.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 403


class TestTenants:
    """Tenant management endpoint tests"""
    
    def test_super_admin_get_tenants(self, api_client, super_admin_token):
        """Super admin can get all tenants"""
        response = api_client.get(
            f"{BASE_URL}/api/tenants",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_tenant_admin_cannot_list_tenants(self, api_client, tenant_admin_token):
        """Tenant admin cannot list all tenants"""
        response = api_client.get(
            f"{BASE_URL}/api/tenants",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 403


class TestGroups:
    """Group management endpoint tests"""
    
    def test_tenant_admin_get_groups(self, api_client, tenant_admin_token):
        """Tenant admin can get groups"""
        response = api_client.get(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_asset_manager_cannot_access_groups(self, api_client, asset_manager_token):
        """Asset manager cannot access groups"""
        response = api_client.get(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {asset_manager_token}"}
        )
        assert response.status_code == 403


class TestApprovalWorkflows:
    """Approval workflow endpoint tests"""
    
    def test_get_approval_workflows(self, api_client, tenant_admin_token):
        """Tenant admin can get approval workflows"""
        response = api_client.get(
            f"{BASE_URL}/api/approval-workflows",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_asset_manager_get_workflows(self, api_client, asset_manager_token):
        """Asset manager can get approval workflows"""
        response = api_client.get(
            f"{BASE_URL}/api/approval-workflows",
            headers={"Authorization": f"Bearer {asset_manager_token}"}
        )
        assert response.status_code == 200


class TestMaintenance:
    """Maintenance schedule endpoint tests"""
    
    def test_get_maintenance_schedules(self, api_client, tenant_admin_token):
        """Get maintenance schedules"""
        response = api_client.get(
            f"{BASE_URL}/api/maintenance",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
