"""
Products/Services CRUD and Financial Year Invoice Numbering Tests
Tests: Products CRUD, Invoice FY numbering, Product selection in invoices
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data storage for cleanup
created_product_ids = []
created_client_ids = []
created_invoice_ids = []


class TestProductsCRUD:
    """Products/Services management tests"""
    
    def test_create_product(self):
        """Create a new product/service"""
        product_data = {
            "name": "TEST_Web Development Service",
            "hsn_sac_code": "998314",
            "price": 50000.00,
            "description": "Full stack web application development"
        }
        
        response = requests.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code == 200, f"Failed to create product: {response.text}"
        
        data = response.json()
        assert data["name"] == product_data["name"]
        assert data["hsn_sac_code"] == product_data["hsn_sac_code"]
        assert data["price"] == product_data["price"]
        assert data["description"] == product_data["description"]
        assert "id" in data
        assert "created_at" in data
        
        created_product_ids.append(data["id"])
        print(f"✓ Created product: {data['name']} (ID: {data['id']})")
        return data
    
    def test_create_product_without_description(self):
        """Create a product without optional description"""
        product_data = {
            "name": "TEST_Cloud Hosting",
            "hsn_sac_code": "998315",
            "price": 10000.00
        }
        
        response = requests.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code == 200, f"Failed to create product: {response.text}"
        
        data = response.json()
        assert data["name"] == product_data["name"]
        assert data["description"] is None or data["description"] == ""
        
        created_product_ids.append(data["id"])
        print(f"✓ Created product without description: {data['name']}")
        return data
    
    def test_get_all_products(self):
        """Get all products list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} products")
        return data
    
    def test_get_single_product(self):
        """Get a single product by ID"""
        if not created_product_ids:
            pytest.skip("No products created yet")
        
        product_id = created_product_ids[0]
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == product_id
        print(f"✓ Retrieved product: {data['name']}")
    
    def test_update_product(self):
        """Update a product's information"""
        if not created_product_ids:
            pytest.skip("No products created yet")
        
        product_id = created_product_ids[0]
        
        update_data = {
            "name": "TEST_Web Development Service Updated",
            "hsn_sac_code": "998314",
            "price": 60000.00,
            "description": "Updated description - Full stack development"
        }
        
        response = requests.put(f"{BASE_URL}/api/products/{product_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["price"] == update_data["price"]
        assert data["description"] == update_data["description"]
        print(f"✓ Updated product: {data['name']}")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        get_data = get_response.json()
        assert get_data["name"] == update_data["name"]
        print(f"✓ Verified update persisted")
    
    def test_get_nonexistent_product(self):
        """Test 404 for non-existent product"""
        response = requests.get(f"{BASE_URL}/api/products/nonexistent123")
        assert response.status_code == 404
        print("✓ Correctly returned 404 for non-existent product")
    
    def test_delete_product(self):
        """Delete a product"""
        # Create a product to delete
        product_data = {
            "name": "TEST_ToDelete Product",
            "hsn_sac_code": "998316",
            "price": 5000.00
        }
        
        create_response = requests.post(f"{BASE_URL}/api/products", json=product_data)
        product_id = create_response.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert get_response.status_code == 404
        print(f"✓ Deleted product and verified removal")


class TestFinancialYearInvoiceNumbering:
    """Test invoice numbering with financial year reset"""
    
    def test_health_shows_financial_year(self):
        """Verify health endpoint shows current financial year"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "financial_year" in data
        
        # Verify format is YYYY-YYYY
        fy = data["financial_year"]
        assert "-" in fy
        parts = fy.split("-")
        assert len(parts) == 2
        assert int(parts[1]) == int(parts[0]) + 1
        
        print(f"✓ Current financial year: {fy}")
        return fy
    
    def test_invoice_number_format(self):
        """Test that invoice numbers are 4-digit padded"""
        # First ensure we have a client
        clients_response = requests.get(f"{BASE_URL}/api/clients")
        clients = clients_response.json()
        
        if not clients:
            # Create a test client
            client_data = {
                "client_type": "organization",
                "name": "TEST_FY Invoice Client",
                "address": "Chennai, Tamil Nadu",
                "state": "Tamil Nadu",
                "phone": "+91-9876543210",
                "email": "test_fy@example.com"
            }
            client_response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
            client = client_response.json()
            created_client_ids.append(client["id"])
        else:
            client = clients[0]
        
        # Create invoice
        today = datetime.now().strftime("%Y-%m-%d")
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        invoice_data = {
            "client_id": client["id"],
            "invoice_date": today,
            "due_date": due_date,
            "line_items": [
                {
                    "description": "FY Test Service",
                    "hsn_sac_code": "998314",
                    "quantity": 1,
                    "rate": 1000.00,
                    "amount": 1000.00
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify invoice number is 4 digits
        assert len(data["invoice_number"]) == 4
        assert data["invoice_number"].isdigit()
        
        created_invoice_ids.append(data["id"])
        print(f"✓ Invoice number format correct: #{data['invoice_number']}")
        return data


class TestInvoiceWithProductSelection:
    """Test creating invoices using pre-defined products"""
    
    def test_create_invoice_with_product_data(self):
        """Create invoice using product data (simulating product selection)"""
        # Get existing products
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        
        if not products:
            pytest.skip("No products available")
        
        product = products[0]
        
        # Get a client
        clients_response = requests.get(f"{BASE_URL}/api/clients")
        clients = clients_response.json()
        
        if not clients:
            pytest.skip("No clients available")
        
        client = clients[0]
        
        # Create invoice using product data
        today = datetime.now().strftime("%Y-%m-%d")
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        invoice_data = {
            "client_id": client["id"],
            "invoice_date": today,
            "due_date": due_date,
            "line_items": [
                {
                    "description": product["name"],
                    "hsn_sac_code": product["hsn_sac_code"],
                    "quantity": 1,
                    "rate": product["price"],
                    "amount": product["price"]
                }
            ],
            "notes": "Invoice created using pre-defined product"
        }
        
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify line item matches product
        assert data["line_items"][0]["description"] == product["name"]
        assert data["line_items"][0]["hsn_sac_code"] == product["hsn_sac_code"]
        assert data["line_items"][0]["rate"] == product["price"]
        
        created_invoice_ids.append(data["id"])
        print(f"✓ Created invoice #{data['invoice_number']} using product: {product['name']}")
        return data
    
    def test_create_invoice_with_manual_entry(self):
        """Create invoice with manual line item entry (not using product)"""
        # Get a client
        clients_response = requests.get(f"{BASE_URL}/api/clients")
        clients = clients_response.json()
        
        if not clients:
            pytest.skip("No clients available")
        
        client = clients[0]
        
        # Create invoice with manual entry
        today = datetime.now().strftime("%Y-%m-%d")
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        invoice_data = {
            "client_id": client["id"],
            "invoice_date": today,
            "due_date": due_date,
            "line_items": [
                {
                    "description": "Custom Manual Service Entry",
                    "hsn_sac_code": "998399",
                    "quantity": 2,
                    "rate": 7500.00,
                    "amount": 15000.00
                }
            ],
            "notes": "Invoice with manual entry"
        }
        
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify manual entry
        assert data["line_items"][0]["description"] == "Custom Manual Service Entry"
        assert data["line_items"][0]["quantity"] == 2
        assert data["line_items"][0]["rate"] == 7500.00
        assert data["subtotal"] == 15000.00
        
        created_invoice_ids.append(data["id"])
        print(f"✓ Created invoice #{data['invoice_number']} with manual entry")
        return data


class TestGSTCalculationStillWorks:
    """Verify GST calculation still works correctly after changes"""
    
    def test_intrastate_gst_calculation(self):
        """Test CGST+SGST for Tamil Nadu client"""
        # Get or create Tamil Nadu client
        clients_response = requests.get(f"{BASE_URL}/api/clients")
        clients = clients_response.json()
        
        tn_client = next((c for c in clients if c["state"] == "Tamil Nadu"), None)
        
        if not tn_client:
            client_data = {
                "client_type": "organization",
                "name": "TEST_GST TN Client",
                "address": "Chennai",
                "state": "Tamil Nadu",
                "phone": "+91-9876543210",
                "email": "test_gst_tn@example.com"
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
                    "description": "GST Test Service",
                    "hsn_sac_code": "998314",
                    "quantity": 1,
                    "rate": 10000.00,
                    "amount": 10000.00
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify intra-state GST
        assert data["cgst"] == 900.00, f"CGST should be 900, got {data['cgst']}"
        assert data["sgst"] == 900.00, f"SGST should be 900, got {data['sgst']}"
        assert data["igst"] == 0.0, f"IGST should be 0, got {data['igst']}"
        assert data["total"] == 11800.00, f"Total should be 11800, got {data['total']}"
        
        created_invoice_ids.append(data["id"])
        print(f"✓ Intra-state GST correct: CGST={data['cgst']}, SGST={data['sgst']}, Total={data['total']}")
    
    def test_interstate_gst_calculation(self):
        """Test IGST for non-Tamil Nadu client"""
        # Get or create Karnataka client
        clients_response = requests.get(f"{BASE_URL}/api/clients")
        clients = clients_response.json()
        
        ka_client = next((c for c in clients if c["state"] == "Karnataka"), None)
        
        if not ka_client:
            client_data = {
                "client_type": "individual",
                "name": "TEST_GST KA Client",
                "address": "Bangalore",
                "state": "Karnataka",
                "phone": "+91-9988776655",
                "email": "test_gst_ka@example.com"
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
                    "description": "GST Test Service Interstate",
                    "hsn_sac_code": "998314",
                    "quantity": 1,
                    "rate": 10000.00,
                    "amount": 10000.00
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify inter-state GST
        assert data["cgst"] == 0.0, f"CGST should be 0, got {data['cgst']}"
        assert data["sgst"] == 0.0, f"SGST should be 0, got {data['sgst']}"
        assert data["igst"] == 1800.00, f"IGST should be 1800, got {data['igst']}"
        assert data["total"] == 11800.00, f"Total should be 11800, got {data['total']}"
        
        created_invoice_ids.append(data["id"])
        print(f"✓ Inter-state GST correct: IGST={data['igst']}, Total={data['total']}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_products(self):
        """Delete test-created products"""
        deleted_count = 0
        for product_id in created_product_ids:
            try:
                response = requests.delete(f"{BASE_URL}/api/products/{product_id}")
                if response.status_code == 200:
                    deleted_count += 1
            except:
                pass
        
        print(f"✓ Cleaned up {deleted_count} test products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
