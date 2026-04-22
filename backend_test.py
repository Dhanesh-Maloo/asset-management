#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ITAssetAPITester:
    def __init__(self, base_url="https://it-service-hub-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}
        self.test_data = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"[PASS] {test_name}")
        else:
            print(f"[FAIL] {test_name} - {details}")
            self.failed_tests.append({"test": test_name, "details": details})

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            result_data = {}
            
            try:
                result_data = response.json()
            except:
                result_data = {"text": response.text}

            return success, result_data, response.status_code

        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0

    def test_authentication(self):
        """Test authentication with different user roles"""
        print("\n Testing Authentication...")
        
        credentials = [
            ("super_admin", "admin@itassets.com", "admin123"),
            ("tenant_admin", "admin@acme.com", "acme123"),
            ("asset_manager", "manager@acme.com", "acme123"),
            ("employee", "employee@acme.com", "acme123")
        ]
        
        for role, email, password in credentials:
            success, data, status = self.make_request(
                'POST', 'auth/login', 
                {"email": email, "password": password}
            )
            
            if success and 'token' in data:
                self.tokens[role] = data['token']
                self.test_data[f"{role}_user"] = data['user']
                self.log_result(f"Login as {role}", True)
            else:
                self.log_result(f"Login as {role}", False, f"Status: {status}, Data: {data}")

    def test_dashboard_stats(self):
        """Test dashboard statistics for different roles"""
        print("\n[REPORT] Testing Dashboard Stats...")
        
        for role, token in self.tokens.items():
            success, data, status = self.make_request(
                'GET', 'dashboard/stats', token=token
            )
            
            if success and isinstance(data, dict):
                required_fields = ['total_assets', 'assigned_assets', 'available_assets', 'open_tickets', 'pending_orders']
                has_required = all(field in data for field in required_fields)
                self.log_result(f"Dashboard stats for {role}", has_required, 
                              f"Missing fields" if not has_required else "")
            else:
                self.log_result(f"Dashboard stats for {role}", False, f"Status: {status}")

    def test_products_catalog(self):
        """Test product catalog functionality"""
        print("\n Testing Product Catalog...")
        
        # Test getting products (should work for all authenticated users)
        for role, token in self.tokens.items():
            success, data, status = self.make_request(
                'GET', 'products', token=token
            )
            self.log_result(f"Get products as {role}", success, f"Status: {status}")
            
            if success and isinstance(data, list):
                self.test_data['products'] = data

        # Test creating product (should work for admin roles only)
        admin_roles = ['super_admin', 'tenant_admin', 'asset_manager']
        test_product = {
            "name": "Test Laptop",
            "category": "Laptops",
            "description": "Test laptop for automation",
            "specs": {"cpu": "Intel i7", "ram": "16GB"},
            "stock": 10,
            "price": 1200.0
        }
        
        for role in admin_roles:
            if role in self.tokens:
                success, data, status = self.make_request(
                    'POST', 'products', test_product, token=self.tokens[role], expected_status=200
                )
                if success:
                    self.test_data['test_product'] = data
                self.log_result(f"Create product as {role}", success, f"Status: {status}")
                break

    def test_order_workflow(self):
        """Test order placement and approval workflow"""
        print("\n Testing Order Workflow...")
        
        if 'test_product' not in self.test_data:
            self.log_result("Order workflow", False, "No test product available")
            return

        product_id = self.test_data['test_product']['id']
        
        # Employee places order
        if 'employee' in self.tokens:
            order_data = {"product_id": product_id, "quantity": 2}
            success, data, status = self.make_request(
                'POST', 'orders', order_data, token=self.tokens['employee'], expected_status=200
            )
            
            if success:
                self.test_data['test_order'] = data
                self.log_result("Employee place order", True)
                
                # Admin approves order
                if 'tenant_admin' in self.tokens:
                    order_id = data['id']
                    approval_data = {"status": "approved"}
                    success, _, status = self.make_request(
                        'PATCH', f'orders/{order_id}', approval_data, 
                        token=self.tokens['tenant_admin']
                    )
                    self.log_result("Admin approve order", success, f"Status: {status}")
            else:
                self.log_result("Employee place order", False, f"Status: {status}")

        # Test getting orders for different roles
        for role, token in self.tokens.items():
            success, data, status = self.make_request(
                'GET', 'orders', token=token
            )
            self.log_result(f"Get orders as {role}", success, f"Status: {status}")

    def test_asset_management(self):
        """Test asset management functionality"""
        print("\n Testing Asset Management...")
        
        # Create test asset (admin only)
        admin_roles = ['super_admin', 'tenant_admin', 'asset_manager']
        test_asset = {
            "asset_tag": "TEST-001",
            "product_id": self.test_data.get('test_product', {}).get('id', 'dummy-id'),
            "serial_number": "SN123456789",
            "tenant_id": "test-tenant",
            "location": "Office A"
        }
        
        for role in admin_roles:
            if role in self.tokens:
                success, data, status = self.make_request(
                    'POST', 'assets', test_asset, token=self.tokens[role], expected_status=200
                )
                if success:
                    self.test_data['test_asset'] = data
                    self.log_result(f"Create asset as {role}", True)
                    
                    # Test asset assignment
                    if 'employee' in self.test_data:
                        employee_id = self.test_data['employee_user']['id']
                        assign_data = {"assigned_to": employee_id}
                        asset_id = data['id']
                        
                        success, _, status = self.make_request(
                            'PATCH', f'assets/{asset_id}/assign', assign_data, 
                            token=self.tokens[role]
                        )
                        self.log_result(f"Assign asset as {role}", success, f"Status: {status}")
                else:
                    self.log_result(f"Create asset as {role}", False, f"Status: {status}")
                break

        # Test getting assets for different roles
        for role, token in self.tokens.items():
            success, data, status = self.make_request(
                'GET', 'assets', token=token
            )
            self.log_result(f"Get assets as {role}", success, f"Status: {status}")

    def test_helpdesk_tickets(self):
        """Test helpdesk ticket functionality"""
        print("\n Testing Helpdesk Tickets...")
        
        # Create ticket (all users should be able to)
        ticket_data = {
            "title": "Test IT Issue",
            "description": "This is a test ticket for automation",
            "priority": "medium",
            "category": "hardware"
        }
        
        for role, token in self.tokens.items():
            success, data, status = self.make_request(
                'POST', 'tickets', ticket_data, token=token, expected_status=200
            )
            
            if success and role == 'employee':
                self.test_data['test_ticket'] = data
            
            self.log_result(f"Create ticket as {role}", success, f"Status: {status}")

        # Test ticket updates (admin roles only)
        if 'test_ticket' in self.test_data:
            ticket_id = self.test_data['test_ticket']['id']
            update_data = {"status": "in_progress"}
            
            admin_roles = ['super_admin', 'tenant_admin', 'asset_manager', 'helpdesk_agent']
            for role in admin_roles:
                if role in self.tokens:
                    success, _, status = self.make_request(
                        'PATCH', f'tickets/{ticket_id}', update_data, 
                        token=self.tokens[role]
                    )
                    self.log_result(f"Update ticket as {role}", success, f"Status: {status}")
                    break

        # Test getting tickets for different roles
        for role, token in self.tokens.items():
            success, data, status = self.make_request(
                'GET', 'tickets', token=token
            )
            self.log_result(f"Get tickets as {role}", success, f"Status: {status}")

    def test_user_management(self):
        """Test user management functionality"""
        print("\n Testing User Management...")
        
        # Test getting users (admin roles only)
        admin_roles = ['super_admin', 'tenant_admin']
        for role in admin_roles:
            if role in self.tokens:
                success, data, status = self.make_request(
                    'GET', 'users', token=self.tokens[role]
                )
                self.log_result(f"Get users as {role}", success, f"Status: {status}")

        # Test creating user (admin roles only)
        new_user = {
            "email": "test@example.com",
            "password": "testpass123",
            "name": "Test User",
            "role": "employee",
            "tenant_id": "test-tenant"
        }
        
        for role in admin_roles:
            if role in self.tokens:
                success, data, status = self.make_request(
                    'POST', 'auth/register', new_user, token=self.tokens[role], expected_status=200
                )
                self.log_result(f"Create user as {role}", success, f"Status: {status}")
                break

    def test_tenant_management(self):
        """Test tenant management functionality (super admin only)"""
        print("\n Testing Tenant Management...")
        
        if 'super_admin' not in self.tokens:
            self.log_result("Tenant management", False, "No super admin token available")
            return

        # Test getting tenants
        success, data, status = self.make_request(
            'GET', 'tenants', token=self.tokens['super_admin']
        )
        self.log_result("Get tenants as super_admin", success, f"Status: {status}")

        # Test creating tenant
        tenant_data = {
            "name": "Test Organization",
            "domain": "test.example.com"
        }
        
        success, data, status = self.make_request(
            'POST', 'tenants', tenant_data, token=self.tokens['super_admin'], expected_status=200
        )
        self.log_result("Create tenant as super_admin", success, f"Status: {status}")

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n Testing Role-Based Access Control...")
        
        # Employee should not be able to access admin endpoints
        if 'employee' in self.tokens:
            # Try to access users endpoint (should fail)
            success, data, status = self.make_request(
                'GET', 'users', token=self.tokens['employee'], expected_status=403
            )
            self.log_result("Employee access users (should fail)", success, f"Status: {status}")
            
            # Try to access tenants endpoint (should fail)
            success, data, status = self.make_request(
                'GET', 'tenants', token=self.tokens['employee'], expected_status=403
            )
            self.log_result("Employee access tenants (should fail)", success, f"Status: {status}")

    def run_all_tests(self):
        """Run all test suites"""
        print("[START] Starting IT Asset Management API Tests...")
        print(f"Testing against: {self.base_url}")
        
        try:
            self.test_authentication()
            self.test_dashboard_stats()
            self.test_products_catalog()
            self.test_order_workflow()
            self.test_asset_management()
            self.test_helpdesk_tickets()
            self.test_user_management()
            self.test_tenant_management()
            self.test_role_based_access()
            
        except Exception as e:
            print(f"[FAIL] Test execution failed: {str(e)}")
            return False

        # Print summary
        print(f"\n[REPORT] Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n[FAIL] Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = ITAssetAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)