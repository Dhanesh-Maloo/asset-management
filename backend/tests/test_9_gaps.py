"""
Test suite for 9 gaps in IT Asset Management App:
1. Order confirmation dialog with qty/notes
2. Product sorting
3. Price validation >0
4. Stock deduction on order approval
5. Assigned To column in Helpdesk
6. Settings page for super admin shows tenant selector
7. Add Asset button
8. Delete Group
9. Forgot Password flow
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://it-service-hub-8.preview.emergentagent.com')
API = f"{BASE_URL}/api"

# Test credentials
SUPER_ADMIN = {"email": "admin@itassets.com", "password": "admin123"}
TENANT_ADMIN = {"email": "admin@acme.com", "password": "acme123"}
ASSET_MANAGER = {"email": "manager@acme.com", "password": "acme123"}
EMPLOYEE = {"email": "employee@acme.com", "password": "acme123"}


@pytest.fixture(scope="module")
def super_admin_token():
    """Get super admin auth token"""
    response = requests.post(f"{API}/auth/login", json=SUPER_ADMIN)
    assert response.status_code == 200, f"Super admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def tenant_admin_token():
    """Get tenant admin auth token"""
    response = requests.post(f"{API}/auth/login", json=TENANT_ADMIN)
    assert response.status_code == 200, f"Tenant admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def asset_manager_token():
    """Get asset manager auth token"""
    response = requests.post(f"{API}/auth/login", json=ASSET_MANAGER)
    assert response.status_code == 200, f"Asset manager login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def employee_token():
    """Get employee auth token"""
    response = requests.post(f"{API}/auth/login", json=EMPLOYEE)
    assert response.status_code == 200, f"Employee login failed: {response.text}"
    return response.json()["token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ===== Issue 3: Price validation >0 =====
class TestPriceValidation:
    """Issue 3: Product creation with price=0 should be rejected"""
    
    def test_create_product_with_zero_price_rejected(self, tenant_admin_token):
        """Backend should reject price=0"""
        response = requests.post(
            f"{API}/products",
            json={
                "name": "TEST_ZeroPrice",
                "category": "Test",
                "description": "Test product with zero price",
                "price": 0,
                "stock": 10
            },
            headers=auth_headers(tenant_admin_token)
        )
        assert response.status_code == 422, f"Expected 422 for price=0, got {response.status_code}: {response.text}"
        assert "price" in response.text.lower() or "greater than 0" in response.text.lower()
    
    def test_create_product_with_negative_price_rejected(self, tenant_admin_token):
        """Backend should reject negative price"""
        response = requests.post(
            f"{API}/products",
            json={
                "name": "TEST_NegativePrice",
                "category": "Test",
                "description": "Test product with negative price",
                "price": -10,
                "stock": 10
            },
            headers=auth_headers(tenant_admin_token)
        )
        assert response.status_code == 422, f"Expected 422 for negative price, got {response.status_code}"
    
    def test_create_product_with_valid_price_succeeds(self, tenant_admin_token):
        """Backend should accept valid price > 0"""
        response = requests.post(
            f"{API}/products",
            json={
                "name": "TEST_ValidPrice",
                "category": "Test",
                "description": "Test product with valid price",
                "price": 99.99,
                "stock": 10
            },
            headers=auth_headers(tenant_admin_token)
        )
        assert response.status_code == 200, f"Expected 200 for valid price, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["price"] == 99.99


# ===== Issue 1 & 4: Order with delivery_notes and stock deduction =====
class TestOrderAndStockDeduction:
    """Issue 1: Order with delivery_notes, Issue 4: Stock deduction on approval"""
    
    def test_create_order_with_delivery_notes(self, super_admin_token):
        """Order should accept delivery_notes field (using super_admin to bypass tier limits)"""
        # First get a product
        products_response = requests.get(f"{API}/products", headers=auth_headers(super_admin_token))
        assert products_response.status_code == 200
        products = products_response.json()
        assert len(products) > 0, "No products available for testing"
        
        product = products[0]
        
        response = requests.post(
            f"{API}/orders",
            json={
                "product_id": product["id"],
                "quantity": 1,
                "delivery_notes": "Please deliver to Building A, Floor 3"
            },
            headers=auth_headers(super_admin_token)
        )
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        order = response.json()
        assert order["delivery_notes"] == "Please deliver to Building A, Floor 3"
        assert order["quantity"] == 1
        return order
    
    def test_stock_deduction_on_order_approval(self, super_admin_token):
        """Stock should decrease when order is approved (using super_admin to bypass tier limits)"""
        # Get products and find one with stock
        products_response = requests.get(f"{API}/products", headers=auth_headers(super_admin_token))
        products = products_response.json()
        
        # Find a product with stock > 0
        product_with_stock = None
        for p in products:
            if p.get("stock", 0) > 0:
                product_with_stock = p
                break
        
        if not product_with_stock:
            pytest.skip("No products with stock available for testing")
        
        initial_stock = product_with_stock["stock"]
        product_id = product_with_stock["id"]
        
        # Create an order
        order_response = requests.post(
            f"{API}/orders",
            json={
                "product_id": product_id,
                "quantity": 1,
                "delivery_notes": "TEST_StockDeduction"
            },
            headers=auth_headers(super_admin_token)
        )
        assert order_response.status_code == 200, f"Order creation failed: {order_response.text}"
        order = order_response.json()
        order_id = order["id"]
        
        # Approve the order
        approve_response = requests.patch(
            f"{API}/orders/{order_id}",
            json={"status": "approved"},
            headers=auth_headers(super_admin_token)
        )
        assert approve_response.status_code == 200, f"Order approval failed: {approve_response.text}"
        
        # Verify stock decreased
        product_response = requests.get(f"{API}/products/{product_id}", headers=auth_headers(super_admin_token))
        assert product_response.status_code == 200
        updated_product = product_response.json()
        
        assert updated_product["stock"] == initial_stock - 1, \
            f"Stock not deducted. Expected {initial_stock - 1}, got {updated_product['stock']}"


# ===== Issue 5: Assigned To in Tickets =====
class TestTicketsAssignedTo:
    """Issue 5: Tickets should have assigned_to field"""
    
    def test_create_ticket_and_assign(self, tenant_admin_token):
        """Create ticket and assign to a user"""
        # Create a ticket
        ticket_response = requests.post(
            f"{API}/tickets",
            json={
                "title": "TEST_AssignedTo Ticket",
                "description": "Testing assigned_to field",
                "priority": "medium",
                "category": "general"
            },
            headers=auth_headers(tenant_admin_token)
        )
        assert ticket_response.status_code == 200
        ticket = ticket_response.json()
        ticket_id = ticket["id"]
        
        # Get users to find someone to assign
        users_response = requests.get(f"{API}/users", headers=auth_headers(tenant_admin_token))
        assert users_response.status_code == 200
        users = users_response.json()
        
        if len(users) > 0:
            user_to_assign = users[0]["id"]
            
            # Assign the ticket
            update_response = requests.patch(
                f"{API}/tickets/{ticket_id}",
                json={"assigned_to": user_to_assign},
                headers=auth_headers(tenant_admin_token)
            )
            assert update_response.status_code == 200
            updated_ticket = update_response.json()
            assert updated_ticket["assigned_to"] == user_to_assign
    
    def test_tickets_list_includes_assigned_to(self, tenant_admin_token):
        """Tickets list should include assigned_to field"""
        response = requests.get(f"{API}/tickets", headers=auth_headers(tenant_admin_token))
        assert response.status_code == 200
        tickets = response.json()
        
        # Check that tickets have assigned_to field (can be null)
        for ticket in tickets:
            assert "assigned_to" in ticket, "Ticket missing assigned_to field"


# ===== Issue 6: Tenant Settings for Super Admin =====
class TestTenantSettings:
    """Issue 6: Super admin should see tenant selector in settings"""
    
    def test_super_admin_can_list_tenants(self, super_admin_token):
        """Super admin should be able to list all tenants"""
        response = requests.get(f"{API}/tenants", headers=auth_headers(super_admin_token))
        assert response.status_code == 200
        tenants = response.json()
        assert len(tenants) > 0, "No tenants found"
        
        # Verify tenant structure
        for tenant in tenants:
            assert "id" in tenant
            assert "name" in tenant
            assert "domain" in tenant
    
    def test_super_admin_can_get_tenant_details(self, super_admin_token):
        """Super admin should be able to get tenant details"""
        # First get list of tenants
        tenants_response = requests.get(f"{API}/tenants", headers=auth_headers(super_admin_token))
        tenants = tenants_response.json()
        
        if len(tenants) > 0:
            tenant_id = tenants[0]["id"]
            response = requests.get(f"{API}/tenants/{tenant_id}", headers=auth_headers(super_admin_token))
            assert response.status_code == 200
            tenant = response.json()
            assert tenant["id"] == tenant_id


# ===== Issue 7: Add Asset =====
class TestAddAsset:
    """Issue 7: Add Asset functionality"""
    
    def test_create_asset(self, tenant_admin_token):
        """Should be able to create a new asset"""
        # Get a product to associate with asset
        products_response = requests.get(f"{API}/products", headers=auth_headers(tenant_admin_token))
        products = products_response.json()
        
        if len(products) == 0:
            pytest.skip("No products available for asset creation")
        
        product_id = products[0]["id"]
        
        response = requests.post(
            f"{API}/assets",
            json={
                "asset_tag": f"TEST-ASSET-{int(time.time())}",
                "product_id": product_id,
                "serial_number": f"SN-TEST-{int(time.time())}",
                "tenant_id": "tenant-1",
                "location": "Office A, Floor 2",
                "purchase_price": 1500.00
            },
            headers=auth_headers(tenant_admin_token)
        )
        assert response.status_code == 200, f"Asset creation failed: {response.text}"
        asset = response.json()
        assert asset["asset_tag"].startswith("TEST-ASSET-")
        assert asset["location"] == "Office A, Floor 2"
        assert asset["purchase_price"] == 1500.00
    
    def test_list_assets(self, tenant_admin_token):
        """Should be able to list assets"""
        response = requests.get(f"{API}/assets", headers=auth_headers(tenant_admin_token))
        assert response.status_code == 200
        assets = response.json()
        # Verify asset structure
        if len(assets) > 0:
            asset = assets[0]
            assert "id" in asset
            assert "asset_tag" in asset
            assert "product_id" in asset
            assert "serial_number" in asset


# ===== Issue 8: Delete Group =====
class TestDeleteGroup:
    """Issue 8: Delete Group functionality"""
    
    def test_create_and_delete_group(self, super_admin_token):
        """Should be able to create and delete a group"""
        # Get tenants first
        tenants_response = requests.get(f"{API}/tenants", headers=auth_headers(super_admin_token))
        tenants = tenants_response.json()
        tenant_id = tenants[0]["id"] if tenants else "tenant-1"
        
        # Create a group
        create_response = requests.post(
            f"{API}/groups",
            json={
                "name": f"TEST_DeleteGroup_{int(time.time())}",
                "group_type": "user_group",
                "tenant_id": tenant_id,
                "description": "Test group for deletion"
            },
            headers=auth_headers(super_admin_token)
        )
        assert create_response.status_code == 200, f"Group creation failed: {create_response.text}"
        group = create_response.json()
        group_id = group["id"]
        
        # Delete the group
        delete_response = requests.delete(
            f"{API}/groups/{group_id}",
            headers=auth_headers(super_admin_token)
        )
        assert delete_response.status_code == 200, f"Group deletion failed: {delete_response.text}"
        
        # Verify group is deleted
        get_response = requests.get(f"{API}/groups/{group_id}", headers=auth_headers(super_admin_token))
        assert get_response.status_code == 404, "Group should not exist after deletion"
    
    def test_cannot_delete_group_with_users(self, super_admin_token):
        """Should not be able to delete a group with assigned users"""
        # Get groups
        groups_response = requests.get(f"{API}/groups", headers=auth_headers(super_admin_token))
        groups = groups_response.json()
        
        # Get users to find a group with users
        users_response = requests.get(f"{API}/users", headers=auth_headers(super_admin_token))
        users = users_response.json()
        
        # Find a group that has users assigned
        groups_with_users = set()
        for user in users:
            if user.get("group_id"):
                groups_with_users.add(user["group_id"])
        
        if groups_with_users:
            group_id = list(groups_with_users)[0]
            delete_response = requests.delete(
                f"{API}/groups/{group_id}",
                headers=auth_headers(super_admin_token)
            )
            assert delete_response.status_code == 400, \
                f"Should return 400 when deleting group with users, got {delete_response.status_code}"
            assert "user" in delete_response.text.lower() or "assigned" in delete_response.text.lower()


# ===== Issue 9: Forgot Password Flow =====
class TestForgotPassword:
    """Issue 9: Forgot Password flow"""
    
    def test_forgot_password_request(self):
        """Should be able to request password reset"""
        response = requests.post(
            f"{API}/auth/forgot-password",
            json={"email": "admin@itassets.com"}
        )
        assert response.status_code == 200, f"Forgot password request failed: {response.text}"
        data = response.json()
        assert "message" in data
        # In demo mode, token is returned in response
        assert "reset_token" in data, "Reset token should be returned in demo mode"
    
    def test_forgot_password_with_invalid_email(self):
        """Should handle non-existent email gracefully (no info leak)"""
        response = requests.post(
            f"{API}/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        # Should still return 200 to not reveal if email exists
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_reset_password_flow(self):
        """Full password reset flow"""
        # Request reset token
        forgot_response = requests.post(
            f"{API}/auth/forgot-password",
            json={"email": "admin@itassets.com"}
        )
        assert forgot_response.status_code == 200
        reset_token = forgot_response.json().get("reset_token")
        
        if reset_token:
            # Reset password
            reset_response = requests.post(
                f"{API}/auth/reset-password",
                json={
                    "token": reset_token,
                    "new_password": "admin123"  # Reset to same password for testing
                }
            )
            assert reset_response.status_code == 200, f"Password reset failed: {reset_response.text}"
            
            # Verify can login with new password
            login_response = requests.post(
                f"{API}/auth/login",
                json={"email": "admin@itassets.com", "password": "admin123"}
            )
            assert login_response.status_code == 200, "Login after password reset failed"
    
    def test_reset_password_with_invalid_token(self):
        """Should reject invalid reset token"""
        response = requests.post(
            f"{API}/auth/reset-password",
            json={
                "token": "invalid-token-12345",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == 400, f"Expected 400 for invalid token, got {response.status_code}"
    
    def test_reset_password_too_short(self):
        """Should reject password less than 6 characters"""
        # First get a valid token
        forgot_response = requests.post(
            f"{API}/auth/forgot-password",
            json={"email": "admin@itassets.com"}
        )
        reset_token = forgot_response.json().get("reset_token")
        
        if reset_token:
            response = requests.post(
                f"{API}/auth/reset-password",
                json={
                    "token": reset_token,
                    "new_password": "short"  # Less than 6 chars
                }
            )
            assert response.status_code == 400, f"Expected 400 for short password, got {response.status_code}"


# ===== Issue 2: Product Sorting (API returns products, sorting is frontend) =====
class TestProductSorting:
    """Issue 2: Products API should return sortable data"""
    
    def test_products_have_sortable_fields(self, tenant_admin_token):
        """Products should have name, price, stock fields for sorting"""
        response = requests.get(f"{API}/products", headers=auth_headers(tenant_admin_token))
        assert response.status_code == 200
        products = response.json()
        
        for product in products:
            assert "name" in product, "Product missing name field"
            assert "price" in product, "Product missing price field"
            assert "stock" in product, "Product missing stock field"
            assert isinstance(product["name"], str)
            assert isinstance(product["price"], (int, float))
            assert isinstance(product["stock"], int)


# ===== Existing Functionality Tests =====
class TestExistingFunctionality:
    """Verify existing functionality still works"""
    
    def test_login_works(self):
        """Login should work"""
        response = requests.post(f"{API}/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
    
    def test_dashboard_stats(self, tenant_admin_token):
        """Dashboard stats should work"""
        response = requests.get(f"{API}/dashboard/stats", headers=auth_headers(tenant_admin_token))
        assert response.status_code == 200
        stats = response.json()
        assert "total_assets" in stats
        assert "open_tickets" in stats
        assert "pending_orders" in stats
    
    def test_products_list(self, tenant_admin_token):
        """Products list should work"""
        response = requests.get(f"{API}/products", headers=auth_headers(tenant_admin_token))
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_orders_list(self, tenant_admin_token):
        """Orders list should work"""
        response = requests.get(f"{API}/orders", headers=auth_headers(tenant_admin_token))
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_assets_list(self, tenant_admin_token):
        """Assets list should work"""
        response = requests.get(f"{API}/assets", headers=auth_headers(tenant_admin_token))
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_tickets_list(self, tenant_admin_token):
        """Tickets list should work"""
        response = requests.get(f"{API}/tickets", headers=auth_headers(tenant_admin_token))
        assert response.status_code == 200
        assert isinstance(response.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
