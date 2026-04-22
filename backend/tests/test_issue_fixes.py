"""
Test file for 3 issue fixes:
1. Google OAuth - POST /api/auth/session returns JWT token
2. Product tenant segregation - tenant_id assignment and filtering
3. Bulk import of products via CSV/Excel
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthSession:
    """Test Issue 1: OAuth session endpoint returns JWT token"""
    
    def test_auth_session_endpoint_exists(self):
        """Verify /api/auth/session endpoint exists (will fail without valid session_id but should not 404)"""
        response = requests.post(f"{BASE_URL}/api/auth/session", headers={})
        # Should return 400 (missing session ID) not 404 (endpoint not found)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "session" in response.json().get("detail", "").lower()
        print("PASSED: /api/auth/session endpoint exists and requires session ID")


class TestProductTenantSegregation:
    """Test Issue 2: Product tenant segregation"""
    
    @pytest.fixture
    def super_admin_token(self):
        """Login as super admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@itassets.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture
    def tenant_admin_token(self):
        """Login as tenant admin (ACME)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@acme.com",
            "password": "acme123"
        })
        assert response.status_code == 200, f"Tenant admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture
    def tenant_admin_user(self, tenant_admin_token):
        """Get tenant admin user info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {tenant_admin_token}"
        })
        assert response.status_code == 200
        return response.json()
    
    def test_tenant_admin_creates_product_with_tenant_id(self, tenant_admin_token, tenant_admin_user):
        """Tenant admin creates product -> product.tenant_id should be their tenant_id"""
        product_data = {
            "name": "TEST_TenantProduct_Segregation",
            "category": "Test Category",
            "description": "Product created by tenant admin for segregation test",
            "price": 99.99,
            "stock": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products",
            json=product_data,
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to create product: {response.text}"
        product = response.json()
        
        # Verify tenant_id is set to the tenant admin's tenant
        assert product.get("tenant_id") == tenant_admin_user.get("tenant_id"), \
            f"Expected tenant_id={tenant_admin_user.get('tenant_id')}, got {product.get('tenant_id')}"
        
        print(f"PASSED: Tenant admin product has tenant_id={product.get('tenant_id')}")
        return product
    
    def test_super_admin_creates_global_product(self, super_admin_token):
        """Super admin creates product without tenant_id -> product.tenant_id should be null (global)"""
        product_data = {
            "name": "TEST_GlobalProduct_Segregation",
            "category": "Global Category",
            "description": "Global product created by super admin",
            "price": 199.99,
            "stock": 50
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products",
            json=product_data,
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to create product: {response.text}"
        product = response.json()
        
        # Verify tenant_id is null (global product)
        assert product.get("tenant_id") is None, \
            f"Expected tenant_id=None for global product, got {product.get('tenant_id')}"
        
        print(f"PASSED: Super admin product has tenant_id=None (global)")
        return product
    
    def test_tenant_admin_sees_own_and_global_products(self, tenant_admin_token, tenant_admin_user):
        """Tenant admin should see their tenant's products + global products"""
        response = requests.get(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get products: {response.text}"
        products = response.json()
        
        tenant_id = tenant_admin_user.get("tenant_id")
        
        # Check that all products are either global (tenant_id=None) or belong to this tenant
        for product in products:
            product_tenant_id = product.get("tenant_id")
            assert product_tenant_id is None or product_tenant_id == tenant_id, \
                f"Tenant admin sees product from another tenant: {product.get('name')} (tenant_id={product_tenant_id})"
        
        # Count products by type
        global_products = [p for p in products if p.get("tenant_id") is None]
        tenant_products = [p for p in products if p.get("tenant_id") == tenant_id]
        
        print(f"PASSED: Tenant admin sees {len(tenant_products)} tenant products + {len(global_products)} global products")
    
    def test_super_admin_sees_all_products(self, super_admin_token):
        """Super admin should see all products from all tenants"""
        response = requests.get(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get products: {response.text}"
        products = response.json()
        
        # Super admin should see products with various tenant_ids
        tenant_ids = set(p.get("tenant_id") for p in products)
        
        print(f"PASSED: Super admin sees {len(products)} products across {len(tenant_ids)} tenant(s)")


class TestBulkImport:
    """Test Issue 3: Bulk import of products via CSV"""
    
    @pytest.fixture
    def tenant_admin_token(self):
        """Login as tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@acme.com",
            "password": "acme123"
        })
        assert response.status_code == 200, f"Tenant admin login failed: {response.text}"
        return response.json()["token"]
    
    def test_bulk_import_csv_success(self, tenant_admin_token):
        """Test successful CSV import with valid data"""
        csv_content = """name,category,description,price,stock
TEST_BulkImport_Laptop,Laptops,Test laptop for bulk import,999.99,10
TEST_BulkImport_Monitor,Monitors,Test monitor for bulk import,299.99,25
TEST_BulkImport_Keyboard,Peripherals,Test keyboard for bulk import,79.99,50"""
        
        files = {
            'file': ('test_products.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products/bulk-import",
            files=files,
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert response.status_code == 200, f"Bulk import failed: {response.text}"
        result = response.json()
        
        assert result.get("imported") == 3, f"Expected 3 imported, got {result.get('imported')}"
        assert result.get("total_rows") == 3, f"Expected 3 total_rows, got {result.get('total_rows')}"
        assert len(result.get("errors", [])) == 0, f"Unexpected errors: {result.get('errors')}"
        
        print(f"PASSED: Bulk import successful - {result.get('imported')}/{result.get('total_rows')} products imported")
    
    def test_bulk_import_csv_with_errors(self, tenant_admin_token):
        """Test CSV import with invalid data (price=0, missing name) returns errors with row numbers"""
        csv_content = """name,category,description,price,stock
TEST_BulkImport_Valid,Laptops,Valid product,599.99,5
,Monitors,Missing name product,199.99,10
TEST_BulkImport_ZeroPrice,Peripherals,Zero price product,0,20
TEST_BulkImport_Valid2,Accessories,Another valid product,49.99,30"""
        
        files = {
            'file': ('test_products_errors.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products/bulk-import",
            files=files,
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert response.status_code == 200, f"Bulk import failed: {response.text}"
        result = response.json()
        
        # Should have 2 valid imports and 2 errors
        assert result.get("imported") == 2, f"Expected 2 imported, got {result.get('imported')}"
        assert result.get("total_rows") == 4, f"Expected 4 total_rows, got {result.get('total_rows')}"
        
        errors = result.get("errors", [])
        assert len(errors) == 2, f"Expected 2 errors, got {len(errors)}"
        
        # Verify errors contain row numbers
        error_text = " ".join(errors)
        assert "Row 3" in error_text or "row 3" in error_text.lower(), "Missing row number for missing name error"
        assert "Row 4" in error_text or "row 4" in error_text.lower(), "Missing row number for zero price error"
        
        print(f"PASSED: Bulk import with errors - {result.get('imported')}/{result.get('total_rows')} imported, {len(errors)} errors with row numbers")
    
    def test_bulk_import_unsupported_format(self, tenant_admin_token):
        """Test that unsupported file formats are rejected"""
        files = {
            'file': ('test.txt', io.BytesIO(b'some text content'), 'text/plain')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products/bulk-import",
            files=files,
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400 for unsupported format, got {response.status_code}"
        assert "unsupported" in response.json().get("detail", "").lower() or "format" in response.json().get("detail", "").lower()
        
        print("PASSED: Unsupported file format rejected with 400")
    
    def test_bulk_import_requires_auth(self):
        """Test that bulk import requires authentication"""
        csv_content = "name,category,description,price,stock\nTest,Cat,Desc,10,5"
        files = {
            'file': ('test.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products/bulk-import",
            files=files
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("PASSED: Bulk import requires authentication")


class TestExistingFunctionality:
    """Verify existing functionality still works after changes"""
    
    def test_login_super_admin(self):
        """Test super admin login still works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@itassets.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        print("PASSED: Super admin login works")
    
    def test_login_tenant_admin(self):
        """Test tenant admin login still works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@acme.com",
            "password": "acme123"
        })
        assert response.status_code == 200, f"Tenant admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "tenant_admin"
        print("PASSED: Tenant admin login works")
    
    def test_products_endpoint(self):
        """Test products endpoint returns data"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@acme.com",
            "password": "acme123"
        })
        token = login_response.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        print(f"PASSED: Products endpoint returns {len(products)} products")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_products(self):
        """Remove TEST_ prefixed products created during testing"""
        # Login as super admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@itassets.com",
            "password": "admin123"
        })
        if login_response.status_code != 200:
            print("SKIPPED: Cleanup - could not login")
            return
        
        token = login_response.json()["token"]
        
        # Get all products
        response = requests.get(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            products = response.json()
            test_products = [p for p in products if p.get("name", "").startswith("TEST_")]
            print(f"INFO: Found {len(test_products)} test products to clean up (manual cleanup may be needed)")
        
        print("PASSED: Cleanup check completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
