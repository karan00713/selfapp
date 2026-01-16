#!/usr/bin/env python3
"""
GST Billing Software Backend API Testing
Tests all backend endpoints for authentication, clients, invoices, dashboard, and reports
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class GSTBillingAPITester:
    def __init__(self, base_url="https://gstease-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_user = {
            "name": "Test User",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        self.test_client_individual = {
            "client_type": "individual",
            "name": "John Doe",
            "address": "123 Test Street, Test City",
            "state": "Tamil Nadu",  # Same state as company for CGST+SGST
            "phone": "+91-9876543210",
            "email": "john.doe@example.com",
            "aadhar_number": "123456789012",
            "pan_number": "ABCDE1234F"
        }
        
        self.test_client_organization = {
            "client_type": "organization",
            "name": "Test Corp Ltd",
            "address": "456 Business Park, Mumbai",
            "state": "Maharashtra",  # Different state for IGST
            "phone": "+91-9876543211",
            "email": "contact@testcorp.com",
            "cin": "U12345MH2020PTC123456",
            "gst_number": "27ABCDE1234F1Z5",
            "pan_number": "ABCDE1234F"
        }

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make API request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.json() if success else response.text, response.status_code
            
        except Exception as e:
            return False, str(e), 0

    def test_user_registration(self):
        """Test user registration"""
        success, response, status = self.make_request('POST', 'auth/register', self.test_user, 200)
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, f"Status: {status}, Response: {response}")
            return False

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        success, response, status = self.make_request('POST', 'auth/login', login_data, 200)
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_test("User Login", True)
            return True
        else:
            self.log_test("User Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_user_profile(self):
        """Test get current user profile"""
        success, response, status = self.make_request('GET', 'auth/me', None, 200)
        
        if success and 'email' in response:
            self.log_test("Get User Profile", True)
            return True
        else:
            self.log_test("Get User Profile", False, f"Status: {status}, Response: {response}")
            return False

    def test_create_individual_client(self):
        """Test creating individual client"""
        success, response, status = self.make_request('POST', 'clients', self.test_client_individual, 200)
        
        if success and 'id' in response:
            self.individual_client_id = response['id']
            self.log_test("Create Individual Client", True)
            return True
        else:
            self.log_test("Create Individual Client", False, f"Status: {status}, Response: {response}")
            return False

    def test_create_organization_client(self):
        """Test creating organization client"""
        success, response, status = self.make_request('POST', 'clients', self.test_client_organization, 200)
        
        if success and 'id' in response:
            self.organization_client_id = response['id']
            self.log_test("Create Organization Client", True)
            return True
        else:
            self.log_test("Create Organization Client", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_clients(self):
        """Test getting all clients"""
        success, response, status = self.make_request('GET', 'clients', None, 200)
        
        if success and isinstance(response, list) and len(response) >= 2:
            self.log_test("Get All Clients", True)
            return True
        else:
            self.log_test("Get All Clients", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_single_client(self):
        """Test getting single client"""
        if hasattr(self, 'individual_client_id'):
            success, response, status = self.make_request('GET', f'clients/{self.individual_client_id}', None, 200)
            
            if success and response.get('name') == self.test_client_individual['name']:
                self.log_test("Get Single Client", True)
                return True
            else:
                self.log_test("Get Single Client", False, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_test("Get Single Client", False, "No client ID available")
            return False

    def test_update_client(self):
        """Test updating client"""
        if hasattr(self, 'individual_client_id'):
            updated_data = self.test_client_individual.copy()
            updated_data['name'] = 'John Doe Updated'
            
            success, response, status = self.make_request('PUT', f'clients/{self.individual_client_id}', updated_data, 200)
            
            if success and response.get('name') == 'John Doe Updated':
                self.log_test("Update Client", True)
                return True
            else:
                self.log_test("Update Client", False, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_test("Update Client", False, "No client ID available")
            return False

    def test_create_invoice_intrastate(self):
        """Test creating invoice for intra-state client (CGST+SGST)"""
        if hasattr(self, 'individual_client_id'):
            invoice_data = {
                "client_id": self.individual_client_id,
                "invoice_date": datetime.now().strftime('%Y-%m-%d'),
                "due_date": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                "line_items": [
                    {
                        "description": "Software Development Services",
                        "hsn_sac_code": "998314",
                        "quantity": 1,
                        "rate": 10000.0,
                        "amount": 10000.0
                    }
                ],
                "notes": "Test invoice for intra-state GST calculation"
            }
            
            success, response, status = self.make_request('POST', 'invoices', invoice_data, 200)
            
            if success and 'id' in response:
                # Verify GST calculation for intra-state (Tamil Nadu)
                if response.get('cgst') == 900.0 and response.get('sgst') == 900.0 and response.get('igst') == 0.0:
                    self.intrastate_invoice_id = response['id']
                    self.log_test("Create Intra-state Invoice (CGST+SGST)", True)
                    return True
                else:
                    self.log_test("Create Intra-state Invoice (CGST+SGST)", False, f"Wrong GST calculation: CGST={response.get('cgst')}, SGST={response.get('sgst')}, IGST={response.get('igst')}")
                    return False
            else:
                self.log_test("Create Intra-state Invoice (CGST+SGST)", False, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_test("Create Intra-state Invoice (CGST+SGST)", False, "No individual client ID available")
            return False

    def test_create_invoice_interstate(self):
        """Test creating invoice for inter-state client (IGST)"""
        if hasattr(self, 'organization_client_id'):
            invoice_data = {
                "client_id": self.organization_client_id,
                "invoice_date": datetime.now().strftime('%Y-%m-%d'),
                "due_date": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                "line_items": [
                    {
                        "description": "Consulting Services",
                        "hsn_sac_code": "998313",
                        "quantity": 2,
                        "rate": 5000.0,
                        "amount": 10000.0
                    }
                ],
                "notes": "Test invoice for inter-state GST calculation"
            }
            
            success, response, status = self.make_request('POST', 'invoices', invoice_data, 200)
            
            if success and 'id' in response:
                # Verify GST calculation for inter-state (Maharashtra)
                if response.get('cgst') == 0.0 and response.get('sgst') == 0.0 and response.get('igst') == 1800.0:
                    self.interstate_invoice_id = response['id']
                    self.log_test("Create Inter-state Invoice (IGST)", True)
                    return True
                else:
                    self.log_test("Create Inter-state Invoice (IGST)", False, f"Wrong GST calculation: CGST={response.get('cgst')}, SGST={response.get('sgst')}, IGST={response.get('igst')}")
                    return False
            else:
                self.log_test("Create Inter-state Invoice (IGST)", False, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_test("Create Inter-state Invoice (IGST)", False, "No organization client ID available")
            return False

    def test_get_invoices(self):
        """Test getting all invoices"""
        success, response, status = self.make_request('GET', 'invoices', None, 200)
        
        if success and isinstance(response, list) and len(response) >= 2:
            self.log_test("Get All Invoices", True)
            return True
        else:
            self.log_test("Get All Invoices", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_single_invoice(self):
        """Test getting single invoice"""
        if hasattr(self, 'intrastate_invoice_id'):
            success, response, status = self.make_request('GET', f'invoices/{self.intrastate_invoice_id}', None, 200)
            
            if success and response.get('invoice_number'):
                self.log_test("Get Single Invoice", True)
                return True
            else:
                self.log_test("Get Single Invoice", False, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_test("Get Single Invoice", False, "No invoice ID available")
            return False

    def test_update_invoice_payment(self):
        """Test updating invoice payment status"""
        if hasattr(self, 'intrastate_invoice_id'):
            update_data = {
                "payment_status": "partial",
                "paid_amount": 5000.0
            }
            
            success, response, status = self.make_request('PUT', f'invoices/{self.intrastate_invoice_id}', update_data, 200)
            
            if success and response.get('payment_status') == 'partial' and response.get('paid_amount') == 5000.0:
                self.log_test("Update Invoice Payment Status", True)
                return True
            else:
                self.log_test("Update Invoice Payment Status", False, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_test("Update Invoice Payment Status", False, "No invoice ID available")
            return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response, status = self.make_request('GET', 'dashboard/stats', None, 200)
        
        if success and 'total_clients' in response and 'total_invoices' in response:
            expected_clients = 2
            expected_invoices = 2
            
            if response['total_clients'] >= expected_clients and response['total_invoices'] >= expected_invoices:
                self.log_test("Dashboard Statistics", True)
                return True
            else:
                self.log_test("Dashboard Statistics", False, f"Expected at least {expected_clients} clients and {expected_invoices} invoices, got {response['total_clients']} clients and {response['total_invoices']} invoices")
                return False
        else:
            self.log_test("Dashboard Statistics", False, f"Status: {status}, Response: {response}")
            return False

    def test_gst_report(self):
        """Test GST report generation"""
        start_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        params = {
            'start_date': start_date,
            'end_date': end_date
        }
        
        success, response, status = self.make_request('GET', 'reports/gst', params, 200)
        
        if success and 'total_invoices' in response and 'total_tax' in response:
            if response['total_invoices'] >= 2:
                self.log_test("GST Report Generation", True)
                return True
            else:
                self.log_test("GST Report Generation", False, f"Expected at least 2 invoices in report, got {response['total_invoices']}")
                return False
        else:
            self.log_test("GST Report Generation", False, f"Status: {status}, Response: {response}")
            return False

    def test_delete_client(self):
        """Test deleting client"""
        if hasattr(self, 'individual_client_id'):
            success, response, status = self.make_request('DELETE', f'clients/{self.individual_client_id}', None, 200)
            
            if success:
                self.log_test("Delete Client", True)
                return True
            else:
                self.log_test("Delete Client", False, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_test("Delete Client", False, "No client ID available")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting GST Billing Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n🔐 Authentication Tests")
        if not self.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ Login failed, stopping tests")
            return False
            
        self.test_get_user_profile()
        
        # Client Management Tests
        print("\n👥 Client Management Tests")
        self.test_create_individual_client()
        self.test_create_organization_client()
        self.test_get_clients()
        self.test_get_single_client()
        self.test_update_client()
        
        # Invoice Management Tests
        print("\n📄 Invoice Management Tests")
        self.test_create_invoice_intrastate()
        self.test_create_invoice_interstate()
        self.test_get_invoices()
        self.test_get_single_invoice()
        self.test_update_invoice_payment()
        
        # Dashboard and Reports Tests
        print("\n📊 Dashboard and Reports Tests")
        self.test_dashboard_stats()
        self.test_gst_report()
        
        # Cleanup Tests
        print("\n🧹 Cleanup Tests")
        self.test_delete_client()
        
        # Print Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("❌ Some tests failed")
            return False

def main():
    tester = GSTBillingAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())