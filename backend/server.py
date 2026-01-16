from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============= Models =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

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

# ============= Helper Functions =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'email': email,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get('email')
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_next_invoice_number() -> str:
    counter = await db.invoice_counter.find_one({"name": "invoice"})
    
    if not counter:
        # Initialize counter
        await db.invoice_counter.insert_one({"name": "invoice", "current": 1})
        return "0001"
    
    current = counter["current"]
    # Update counter atomically
    await db.invoice_counter.update_one(
        {"name": "invoice"},
        {"$set": {"current": current + 1}}
    )
    
    return str(current).zfill(4)

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

# ============= Authentication Routes =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user_doc = {
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Generate token
    token = create_token(user_data.email)
    
    return {
        "token": token,
        "user": {"email": user_data.email, "name": user_data.name}
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(credentials.email)
    
    return {
        "token": token,
        "user": {"email": user["email"], "name": user["name"]}
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return current_user

# ============= Client Routes =============

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user = Depends(get_current_user)):
    client_doc = client_data.model_dump()
    client_doc["id"] = str(datetime.now(timezone.utc).timestamp()).replace(".", "")
    client_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    client_doc["user_email"] = current_user["email"]
    
    await db.clients.insert_one(client_doc)
    
    return Client(**{k: v for k, v in client_doc.items() if k != "_id"})

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user = Depends(get_current_user)):
    clients = await db.clients.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id, "user_email": current_user["email"]}, {"_id": 0})
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientCreate, current_user = Depends(get_current_user)):
    result = await db.clients.update_one(
        {"id": client_id, "user_email": current_user["email"]},
        {"$set": client_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    updated_client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return updated_client

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id, "user_email": current_user["email"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return {"message": "Client deleted successfully"}

# ============= Invoice Routes =============

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, current_user = Depends(get_current_user)):
    # Get client to determine state for GST calculation
    client = await db.clients.find_one({"id": invoice_data.client_id, "user_email": current_user["email"]}, {"_id": 0})
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate subtotal
    subtotal = sum(item.amount for item in invoice_data.line_items)
    
    # Calculate GST
    gst_details = calculate_gst(subtotal, client["state"])
    
    # Get next invoice number
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
    invoice_doc["user_email"] = current_user["email"]
    
    await db.invoices.insert_one(invoice_doc)
    
    return Invoice(**{k: v for k, v in invoice_doc.items() if k != "_id"})

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(current_user = Depends(get_current_user)):
    invoices = await db.invoices.find({"user_email": current_user["email"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, current_user = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id, "user_email": current_user["email"]}, {"_id": 0})
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice

@api_router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, update_data: InvoiceUpdate, current_user = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.invoices.update_one(
        {"id": invoice_id, "user_email": current_user["email"]},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    updated_invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return updated_invoice

# ============= Dashboard Routes =============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user = Depends(get_current_user)):
    # Get all invoices for the user
    invoices = await db.invoices.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    
    # Get total clients
    total_clients = await db.clients.count_documents({"user_email": current_user["email"]})
    
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
async def get_gst_report(
    start_date: str,
    end_date: str,
    current_user = Depends(get_current_user)
):
    # Parse dates
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    
    # Get invoices in date range
    invoices = await db.invoices.find({
        "user_email": current_user["email"],
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
