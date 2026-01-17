from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="DeepByte Verxe GST Billing API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= Models =============

class ClientBase(BaseModel):
    client_type: Literal["individual", "organization"]
    name: str
    address: str
    state: str
    phone: str
    email: EmailStr
    # Individual fields
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    # Organization fields
    cin: Optional[str] = None
    gst_number: Optional[str] = None

class Client(ClientBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

class ClientCreate(ClientBase):
    pass

class InvoiceLineItem(BaseModel):
    description: str
    hsn_sac_code: str
    quantity: float
    rate: float
    amount: float

class InvoiceBase(BaseModel):
    client_id: str
    invoice_date: str
    due_date: str
    line_items: List[InvoiceLineItem]
    notes: Optional[str] = None

class Invoice(InvoiceBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    invoice_number: str
    subtotal: float
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    total: float
    payment_status: Literal["unpaid", "partial", "paid"] = "unpaid"
    paid_amount: float = 0.0
    created_at: str

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    payment_status: Optional[Literal["unpaid", "partial", "paid"]] = None
    paid_amount: Optional[float] = None
    notes: Optional[str] = None

class DashboardStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_clients: int
    total_invoices: int
    pending_amount: float
    paid_amount: float
    unpaid_invoices: int
    partial_invoices: int
    paid_invoices: int

class GSTReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    period: str
    total_invoices: int
    total_taxable_amount: float
    total_cgst: float
    total_sgst: float
    total_igst: float
    total_tax: float
    total_invoice_value: float

# Products/Services Models
class ProductServiceBase(BaseModel):
    name: str
    hsn_sac_code: str
    price: float
    description: Optional[str] = None

class ProductService(ProductServiceBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

class ProductServiceCreate(ProductServiceBase):
    pass

# ============= Helper Functions =============

def get_current_financial_year() -> str:
    """Get current Indian financial year (April to March)"""
    now = datetime.now()
    if now.month >= 4:  # April onwards
        return f"{now.year}-{now.year + 1}"
    else:  # January to March
        return f"{now.year - 1}-{now.year}"

async def get_next_invoice_number() -> str:
    """Generate next sequential invoice number, resets on April 1st each year"""
    current_fy = get_current_financial_year()
    counter_key = f"invoice_{current_fy}"
    
    counter = await db.invoice_counter.find_one({"name": counter_key})
    
    if not counter:
        # New financial year or first invoice ever - start from 0
        await db.invoice_counter.insert_one({"name": counter_key, "current": 0})
        counter = {"current": 0}
    
    # Increment first, then use - so first invoice is 0001
    new_value = counter["current"] + 1
    await db.invoice_counter.update_one(
        {"name": counter_key},
        {"$set": {"current": new_value}}
    )
    
    return str(new_value).zfill(4)

def calculate_gst(subtotal: float, client_state: str, company_state: str = "Tamil Nadu") -> dict:
    gst_rate = 0.18  # 18% GST
    
    if client_state.lower().strip() == company_state.lower().strip():
        # Intra-state: CGST + SGST
        cgst = round(subtotal * (gst_rate / 2), 2)
        sgst = round(subtotal * (gst_rate / 2), 2)
        return {"cgst": cgst, "sgst": sgst, "igst": 0.0, "total_tax": cgst + sgst}
    else:
        # Inter-state: IGST
        igst = round(subtotal * gst_rate, 2)
        return {"cgst": 0.0, "sgst": 0.0, "igst": igst, "total_tax": igst}

# ============= Client Routes =============

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate):
    client_doc = client_data.model_dump()
    client_doc["id"] = str(datetime.now(timezone.utc).timestamp()).replace(".", "")
    client_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.clients.insert_one(client_doc)
    
    return Client(**{k: v for k, v in client_doc.items() if k != "_id"})

@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientCreate):
    result = await db.clients.update_one(
        {"id": client_id},
        {"$set": client_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    updated_client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return updated_client

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    result = await db.clients.delete_one({"id": client_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return {"message": "Client deleted successfully"}

# ============= Invoice Routes =============

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate):
    # Get client to determine state for GST calculation
    client = await db.clients.find_one({"id": invoice_data.client_id}, {"_id": 0})
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate subtotal
    subtotal = sum(item.amount for item in invoice_data.line_items)
    
    # Calculate GST
    gst_details = calculate_gst(subtotal, client["state"])
    
    # Get next invoice number (resets on April 1st)
    invoice_number = await get_next_invoice_number()
    
    # Create invoice
    invoice_doc = invoice_data.model_dump()
    invoice_doc["id"] = str(datetime.now(timezone.utc).timestamp()).replace(".", "")
    invoice_doc["invoice_number"] = invoice_number
    invoice_doc["subtotal"] = subtotal
    invoice_doc["cgst"] = gst_details["cgst"]
    invoice_doc["sgst"] = gst_details["sgst"]
    invoice_doc["igst"] = gst_details["igst"]
    invoice_doc["total"] = subtotal + gst_details["total_tax"]
    invoice_doc["payment_status"] = "unpaid"
    invoice_doc["paid_amount"] = 0.0
    invoice_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.invoices.insert_one(invoice_doc)
    
    return Invoice(**{k: v for k, v in invoice_doc.items() if k != "_id"})

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    invoices = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice

@api_router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, update_data: InvoiceUpdate):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    updated_invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return updated_invoice

# ============= Products/Services Routes =============

@api_router.post("/products", response_model=ProductService)
async def create_product(product_data: ProductServiceCreate):
    product_doc = product_data.model_dump()
    product_doc["id"] = str(datetime.now(timezone.utc).timestamp()).replace(".", "")
    product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_one(product_doc)
    
    return ProductService(**{k: v for k, v in product_doc.items() if k != "_id"})

@api_router.get("/products", response_model=List[ProductService])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return products

@api_router.get("/products/{product_id}", response_model=ProductService)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product/Service not found")
    
    return product

@api_router.put("/products/{product_id}", response_model=ProductService)
async def update_product(product_id: str, product_data: ProductServiceCreate):
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product/Service not found")
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product/Service not found")
    
    return {"message": "Product/Service deleted successfully"}

# ============= Dashboard Routes =============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    # Get all invoices
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    
    # Get total clients
    total_clients = await db.clients.count_documents({})
    
    # Calculate stats
    total_invoices = len(invoices)
    pending_amount = sum(inv["total"] - inv["paid_amount"] for inv in invoices if inv["payment_status"] != "paid")
    paid_amount = sum(inv["paid_amount"] for inv in invoices)
    unpaid_invoices = len([inv for inv in invoices if inv["payment_status"] == "unpaid"])
    partial_invoices = len([inv for inv in invoices if inv["payment_status"] == "partial"])
    paid_invoices = len([inv for inv in invoices if inv["payment_status"] == "paid"])
    
    return DashboardStats(
        total_clients=total_clients,
        total_invoices=total_invoices,
        pending_amount=pending_amount,
        paid_amount=paid_amount,
        unpaid_invoices=unpaid_invoices,
        partial_invoices=partial_invoices,
        paid_invoices=paid_invoices
    )

# ============= Reports Routes =============

@api_router.get("/reports/gst", response_model=GSTReport)
async def get_gst_report(start_date: str, end_date: str):
    # Parse dates
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    
    # Get invoices in date range
    invoices = await db.invoices.find({
        "invoice_date": {
            "$gte": start.isoformat(),
            "$lte": end.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    # Calculate totals
    total_invoices = len(invoices)
    total_taxable_amount = sum(inv["subtotal"] for inv in invoices)
    total_cgst = sum(inv["cgst"] for inv in invoices)
    total_sgst = sum(inv["sgst"] for inv in invoices)
    total_igst = sum(inv["igst"] for inv in invoices)
    total_tax = total_cgst + total_sgst + total_igst
    total_invoice_value = sum(inv["total"] for inv in invoices)
    
    return GSTReport(
        period=f"{start_date} to {end_date}",
        total_invoices=total_invoices,
        total_taxable_amount=total_taxable_amount,
        total_cgst=total_cgst,
        total_sgst=total_sgst,
        total_igst=total_igst,
        total_tax=total_tax,
        total_invoice_value=total_invoice_value
    )

# ============= Backup Routes =============

@api_router.post("/backup/create")
async def create_backup():
    """Create a database backup"""
    timestamp = datetime.now().strftime("%d_%m_%Y_%H%M%S")
    
    # Get all collections data
    clients = await db.clients.find({}, {"_id": 0}).to_list(10000)
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(10000)
    products = await db.products.find({}, {"_id": 0}).to_list(10000)
    counters = await db.invoice_counter.find({}, {"_id": 0}).to_list(100)
    
    backup_data = {
        "timestamp": timestamp,
        "clients": clients,
        "invoices": invoices,
        "products": products,
        "invoice_counters": counters
    }
    
    return {
        "filename": f"{timestamp}.json",
        "data": backup_data,
        "message": "Backup created successfully"
    }

@api_router.post("/backup/restore")
async def restore_backup(backup_data: dict):
    """Restore database from backup"""
    try:
        # Clear existing data
        await db.clients.delete_many({})
        await db.invoices.delete_many({})
        await db.products.delete_many({})
        await db.invoice_counter.delete_many({})
        
        # Restore data
        if backup_data.get("clients"):
            await db.clients.insert_many(backup_data["clients"])
        if backup_data.get("invoices"):
            await db.invoices.insert_many(backup_data["invoices"])
        if backup_data.get("products"):
            await db.products.insert_many(backup_data["products"])
        if backup_data.get("invoice_counters"):
            await db.invoice_counter.insert_many(backup_data["invoice_counters"])
        
        return {"message": "Backup restored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

# ============= Health Check =============

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "app": "DeepByte Verxe GST Billing", "financial_year": get_current_financial_year()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
