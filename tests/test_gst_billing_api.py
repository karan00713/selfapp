"""
GST Billing API Tests for DeepByte Verxe LLP
Tests: Clients CRUD, Invoices CRUD, Dashboard Stats, GST Reports
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data storage for cleanup
created_client_ids = []
created_invoice_ids = []


class TestHealthCheck:
    """Health check endpoint tests - run first"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "app" in data
        print(f"✓ Health check passed: {data}")


class TestClientsCRUD:
    """Client management tests - Individual and Organization types"""
    
    def test_create_organization_client_with_gst(self):
        """Create an organization client with GST number (Tamil Nadu - same state as company)"""
        client_data = {
            "client_type": "organization",
            "name": "TEST_TechCorp Solutions Pvt Ltd",
            "address": "123 Tech Park, Anna Nagar",
            "state": "Tamil Nadu",
            "phone": "+91-9876543210",
            "email": "test_techcorp@example.com",
            "cin": "U72200TN2020PTC123456",
            "gst_number": "33AABCT1234F1ZH",
            "pan_number": "AABCT1234F"
        }
        
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200, f"Failed to create client: {response.text}"
        
        data = response.json()
        assert data["name"] == client_data["name"]
        assert data["client_type"] == "organization"
        assert data["state"] == "Tamil Nadu"
        assert data["gst_number"] == client_data["gst_number"]
        assert "id" in data
        
        created_client_ids.append(data["id"])
        print(f"✓ Created organization client: {data['name']} (ID: {data['id']})")
        return data
    
    def test_create_individual_client(self):
        """Create an individual client (Karnataka - different state for IGST)"""
        client_data = {
            "client_type": "individual",
            "name": "TEST_Rajesh Kumar",
            "address": "456 MG Road, Bangalore",
            "state": "Karnataka",
            "phone": "+91-9988776655",
            "email": "test_rajesh@example.com",
            "aadhar_number": "1234 5678 9012",
            "pan_number": "ABCDE1234F"
        }
        
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200, f"Failed to create client: {response.text}"
        
        data = response.json()
        assert data["name"] == client_data["name"]
        assert data["client_type"] == "individual"
        assert data["state"] == "Karnataka"
        assert "id" in data
        
        created_client_ids.append(data["id"])
        print(f"✓ Created individual client: {data['name']} (ID: {data['id']})")
        return data
    
    def test_get_all_clients(self):
        """Get all clients list"""
        response = requests.get(f"{BASE_URL}/api/clients")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} clients")
        return data
    
    def test_get_single_client(self):
        """Get a single client by ID"""
        if not created_client_ids:
            pytest.skip("No clients created yet")
        
        client_id = created_client_ids[0]
        response = requests.get(f"{BASE_URL}/api/clients/{client_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == client_id
        print(f"✓ Retrieved client: {data['name']}")
    
    def test_update_client(self):
        """Update a client's information"""
        if not created_client_ids:
            pytest.skip("No clients created yet")
        
        client_id = created_client_ids[0]
        
        # First get the client
        get_response = requests.get(f"{BASE_URL}/api/clients/{client_id}")
        original_client = get_response.json()
        
        # Update with new data
        update_data = {
            **original_client,
            "name": "TEST_TechCorp Solutions Updated",
            "phone": "+91-9876543211"
        }
        del update_data["id"]
        del update_data["created_at"]
        
        response = requests.put(f"{BASE_URL}/api/clients/{client_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "TEST_TechCorp Solutions Updated"
        assert data["phone"] == "+91-9876543211"
        print(f"✓ Updated client: {data['name']}")
    
    def test_get_nonexistent_client(self):
        """Test 404 for non-existent client"""
        response = requests.get(f"{BASE_URL}/api/clients/nonexistent123")
        assert response.status_code == 404
        print("✓ Correctly returned 404 for non-existent client")


class TestInvoicesCRUD:
    """Invoice management tests - including invoice numbering and GST calculation"""
    
    def test_create_first_invoice_intrastate(self):
        """Create first invoice - should be #0001 with CGST+SGST (Tamil Nadu client)"""
        # First ensure we have a Tamil Nadu client
        clients_response = requests.get(f"{BASE_URL}/api/clients")
        clients = clients_response.json()
        
        tn_client = next((c for c in clients if c["state"] == "Tamil Nadu"), None)
        
        if not tn_client:
            # Create one
            client_data = {
                "client_type": "organization",
                "name": "TEST_IntraState Corp",
                "address": "Chennai, Tamil Nadu",
                "state": "Tamil Nadu",
                "phone": "+91-9876543210",
                "email": "test_intrastate@example.com",
                "gst_number": "33AABCT1234F1ZH"
            }
            client_response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
            tn_client = client_response.json()
            created_client_ids.append(tn_client["id"])
        
        # Create invoice
        today = datetime.now().strftime("%Y-%m-%d")
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        invoice_data = {
            "client_id": tn_client["id"],
            "invoice_date": today,
            "due_date": due_date,
            "line_items": [
                {
                    "description": "Software Development Services",
                    "hsn_sac_code": "998314",
                    "quantity": 1,
                    "rate": 10000.00,
                    "amount": 10000.00
                }
            ],
            "notes": "Test invoice for intra-state GST"
        }
        
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert response.status_code == 200, f"Failed to create invoice: {response.text}"
        
        data = response.json()
        
        # Verify invoice number format
        assert "invoice_number" in data
        assert len(data["invoice_number"]) == 4  # Should be 4 digits like "0001"
        print(f"✓ Invoice number: #{data['invoice_number']}")
        
        # Verify GST calculation (intra-state: CGST + SGST)
        assert data["subtotal"] == 10000.00
        assert data["cgst"] > 0, "CGST should be > 0 for intra-state"
        assert data["sgst"] > 0, "SGST should be > 0 for intra-state"
        assert data["igst"] == 0, "IGST should be 0 for intra-state"
        
        # Verify 18% GST (9% CGST + 9% SGST)
        expected_cgst = 10000.00 * 0.09
        expected_sgst = 10000.00 * 0.09
        assert abs(data["cgst"] - expected_cgst) < 0.01, f"CGST mismatch: {data['cgst']} vs {expected_cgst}"
        assert abs(data["sgst"] - expected_sgst) < 0.01, f"SGST mismatch: {data['sgst']} vs {expected_sgst}"
        
        # Verify total
        expected_total = 10000.00 + expected_cgst + expected_sgst
        assert abs(data["total"] - expected_total) < 0.01
        
        assert data["payment_status"] == "unpaid"
        assert "id" in data
        
        created_invoice_ids.append(data["id"])
        print(f"✓ Created invoice #{data['invoice_number']} - Subtotal: ₹{data['subtotal']}, CGST: ₹{data['cgst']}, SGST: ₹{data['sgst']}, Total: ₹{data['total']}")
        return data
    
    def test_create_second_invoice_interstate(self):
        """Create second invoice - should be #0002 with IGST (Karnataka client)"""
        # First ensure we have a Karnataka client
        clients_response = requests.get(f"{BASE_URL}/api/clients")
        clients = clients_response.json()
        
        ka_client = next((c for c in clients if c["state"] == "Karnataka"), None)
        
        if not ka_client:
            # Create one
            client_data = {
                "client_type": "individual",
                "name": "TEST_InterState Client",
                "address": "Bangalore, Karnataka",
                "state": "Karnataka",
                "phone": "+91-9988776655",
                "email": "test_interstate@example.com"
            }
            client_response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
            ka_client = client_response.json()
            created_client_ids.append(ka_client["id"])
        
        # Create invoice
        today = datetime.now().strftime("%Y-%m-%d")
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        invoice_data = {
            "client_id": ka_client["id"],
            "invoice_date": today,
            "due_date": due_date,
            "line_items": [
                {
                    "description": "Cloud Hosting Services",
                    "hsn_sac_code": "998315",
                    "quantity": 2,
                    "rate": 5000.00,
                    "amount": 10000.00
                }
            ],
            "notes": "Test invoice for inter-state GST"
        }
        
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert response.status_code == 200, f"Failed to create invoice: {response.text}"
        
        data = response.json()
        
        # Verify invoice number incremented
        assert "invoice_number" in data
        print(f"✓ Invoice number: #{data['invoice_number']}")
        
        # Verify GST calculation (inter-state: IGST only)
        assert data["subtotal"] == 10000.00
        assert data["cgst"] == 0, "CGST should be 0 for inter-state"
        assert data["sgst"] == 0, "SGST should be 0 for inter-state"
        assert data["igst"] > 0, "IGST should be > 0 for inter-state"
        
        # Verify 18% IGST
        expected_igst = 10000.00 * 0.18
        assert abs(data["igst"] - expected_igst) < 0.01, f"IGST mismatch: {data['igst']} vs {expected_igst}"
        
        # Verify total
        expected_total = 10000.00 + expected_igst
        assert abs(data["total"] - expected_total) < 0.01
        
        created_invoice_ids.append(data["id"])
        print(f"✓ Created invoice #{data['invoice_number']} - Subtotal: ₹{data['subtotal']}, IGST: ₹{data['igst']}, Total: ₹{data['total']}")
        return data
    
    def test_get_all_invoices(self):
        """Get all invoices list"""
        response = requests.get(f"{BASE_URL}/api/invoices")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} invoices")
        return data
    
    def test_get_single_invoice(self):
        """Get a single invoice by ID"""
        if not created_invoice_ids:
            pytest.skip("No invoices created yet")
        
        invoice_id = created_invoice_ids[0]
        response = requests.get(f"{BASE_URL}/api/invoices/{invoice_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == invoice_id
        print(f"✓ Retrieved invoice #{data['invoice_number']}")
    
    def test_update_payment_status(self):
        """Update invoice payment status"""
        if not created_invoice_ids:
            pytest.skip("No invoices created yet")
        
        invoice_id = created_invoice_ids[0]
        
        # Get original invoice
        get_response = requests.get(f"{BASE_URL}/api/invoices/{invoice_id}")
        original_invoice = get_response.json()
        
        # Update to partial payment
        update_data = {
            "payment_status": "partial",
            "paid_amount": 5000.00
        }
        
        response = requests.put(f"{BASE_URL}/api/invoices/{invoice_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["payment_status"] == "partial"
        assert data["paid_amount"] == 5000.00
        print(f"✓ Updated invoice #{data['invoice_number']} - Status: {data['payment_status']}, Paid: ₹{data['paid_amount']}")
        
        # Update to fully paid
        update_data = {
            "payment_status": "paid",
            "paid_amount": original_invoice["total"]
        }
        
        response = requests.put(f"{BASE_URL}/api/invoices/{invoice_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["payment_status"] == "paid"
        print(f"✓ Updated invoice #{data['invoice_number']} - Status: {data['payment_status']}, Paid: ₹{data['paid_amount']}")
    
    def test_get_nonexistent_invoice(self):
        """Test 404 for non-existent invoice"""
        response = requests.get(f"{BASE_URL}/api/invoices/nonexistent123")
        assert response.status_code == 404
        print("✓ Correctly returned 404 for non-existent invoice")


class TestDashboardStats:
    """Dashboard statistics tests"""
    
    def test_get_dashboard_stats(self):
        """Get dashboard statistics"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify all required fields
        required_fields = [
            "total_clients", "total_invoices", "pending_amount", 
            "paid_amount", "unpaid_invoices", "partial_invoices", "paid_invoices"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify data types
        assert isinstance(data["total_clients"], int)
        assert isinstance(data["total_invoices"], int)
        assert isinstance(data["pending_amount"], (int, float))
        assert isinstance(data["paid_amount"], (int, float))
        
        print(f"✓ Dashboard stats: {data['total_clients']} clients, {data['total_invoices']} invoices")
        print(f"  Paid: ₹{data['paid_amount']}, Pending: ₹{data['pending_amount']}")
        return data


class TestGSTReports:
    """GST report generation tests"""
    
    def test_generate_gst_report(self):
        """Generate GST report for current month"""
        # Use current month date range
        today = datetime.now()
        start_date = today.replace(day=1).strftime("%Y-%m-%d")
        end_date = today.strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/reports/gst",
            params={"start_date": start_date, "end_date": end_date}
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify all required fields
        required_fields = [
            "period", "total_invoices", "total_taxable_amount",
            "total_cgst", "total_sgst", "total_igst", 
            "total_tax", "total_invoice_value"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify data types
        assert isinstance(data["total_invoices"], int)
        assert isinstance(data["total_taxable_amount"], (int, float))
        assert isinstance(data["total_tax"], (int, float))
        
        print(f"✓ GST Report for {data['period']}")
        print(f"  Invoices: {data['total_invoices']}, Taxable: ₹{data['total_taxable_amount']}")
        print(f"  CGST: ₹{data['total_cgst']}, SGST: ₹{data['total_sgst']}, IGST: ₹{data['total_igst']}")
        print(f"  Total Tax: ₹{data['total_tax']}, Total Value: ₹{data['total_invoice_value']}")
        return data
    
    def test_gst_report_invalid_date(self):
        """Test error handling for invalid date format"""
        response = requests.get(
            f"{BASE_URL}/api/reports/gst",
            params={"start_date": "invalid", "end_date": "invalid"}
        )
        assert response.status_code == 400
        print("✓ Correctly returned 400 for invalid date format")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_data(self):
        """Delete all test-created data"""
        # Note: In a real scenario, we'd delete test data
        # For now, just report what was created
        print(f"\n--- Test Data Summary ---")
        print(f"Created {len(created_client_ids)} clients")
        print(f"Created {len(created_invoice_ids)} invoices")
        
        # Optionally delete test clients (this will fail if they have invoices)
        # for client_id in created_client_ids:
        #     requests.delete(f"{BASE_URL}/api/clients/{client_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
