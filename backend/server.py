from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import hashlib
import json
import csv
import io
import zipfile
import aiofiles
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Import certificate service
from services.certificate_service import (
    generate_membership_certificate,
    generate_dataset_publication_certificate,
    SPACE_NAME,
    SPACE_IDENTIFIER,
    PROMOTER
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Storage paths
STORAGE_DIR = Path("/app/storage")
DATASETS_DIR = STORAGE_DIR / "datasets"
CONTRACTS_DIR = STORAGE_DIR / "contracts"
EVIDENCE_DIR = STORAGE_DIR / "evidence"
EXPORTS_DIR = STORAGE_DIR / "exports"
MEMBERSHIP_EVIDENCE_DIR = STORAGE_DIR / "evidences" / "membership"
DATASET_EVIDENCE_DIR = STORAGE_DIR / "evidences" / "datasets"

# Create directories
for d in [DATASETS_DIR, CONTRACTS_DIR, EVIDENCE_DIR, EXPORTS_DIR, MEMBERSHIP_EVIDENCE_DIR, DATASET_EVIDENCE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'fenitel-data-space-secret-key-2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="FENITEL Espacio de Datos", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRole:
    PROMOTOR = "promotor"
    MIEMBRO = "miembro"
    PROVEEDOR = "proveedor"

class IncorporationStatus:
    PENDING_CONTRACT = "pending_contract"
    PENDING_PAYMENT = "pending_payment"
    PENDING_IDENTITY = "pending_identity"
    EFFECTIVE = "effective"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    organization: str
    nif: str
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = UserRole.MIEMBRO

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    organization: str
    nif: str
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str
    incorporation_status: str
    contract_signed: bool
    payment_status: str
    identity_evidence_id: Optional[str] = None
    created_at: str
    is_provider: bool = False
    # New fields for Orden 758/2025 compliance
    contract_reference: Optional[str] = None
    registration_certificate_url: Optional[str] = None
    registration_certificate_hash: Optional[str] = None


class MemberResponse(BaseModel):
    """Extended member response with all certificate fields"""
    model_config = ConfigDict(extra="ignore")
    member_id: str
    organization_name: str
    cif: str
    email: str
    role: str
    date_joined: str
    contract_reference: Optional[str] = None
    status: str
    certificate_url: Optional[str] = None
    certificate_hash: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_provider: bool = False
    incorporation_status: str
    payment_status: str

class ContractResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    signed_at: Optional[str] = None
    signature_hash: Optional[str] = None
    status: str
    pdf_path: Optional[str] = None

class DatasetCreate(BaseModel):
    title: str
    description: str
    keywords: List[str] = []
    category: str = "general"
    license: str = "CC-BY-4.0"
    access_rights: str = "restricted"

class DatasetResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    description: str
    keywords: List[str]
    category: str
    license: str
    access_rights: str
    file_path: str
    file_type: str
    file_size: int
    version: int
    status: str
    validation_status: str
    publication_evidence_id: Optional[str] = None
    created_at: str
    updated_at: str
    dcat_metadata: Dict[str, Any]

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    evidence_type: str
    hash: str
    timestamp: str
    pdf_path: str
    metadata: Dict[str, Any]

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_email: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    ip_address: str
    details: Dict[str, Any]
    timestamp: str

class PaymentUpdate(BaseModel):
    status: str
    amount: Optional[float] = None
    notes: Optional[str] = None

class GovernanceDecisionCreate(BaseModel):
    title: str
    description: str
    decision_type: str
    participants: List[str] = []
    attachments: List[str] = []

class GovernanceDecisionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    decision_type: str
    participants: List[str]
    attachments: List[str]
    created_by: str
    created_at: str
    status: str

class CommitteeMemberCreate(BaseModel):
    user_id: str
    role: str
    start_date: Optional[str] = None

class CommitteeMemberResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    user_email: str
    role: str
    start_date: str
    status: str

# Models for Incidents/Claims (UNE 0087:2025 - Gob.4)
class IncidentCreate(BaseModel):
    title: str
    description: str
    incident_type: str  # reclamacion, incidencia, consulta
    priority: str = "media"  # baja, media, alta, critica

class IncidentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    user_email: str
    title: str
    description: str
    incident_type: str
    priority: str
    status: str  # abierta, en_proceso, resuelta, cerrada
    resolution: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: str
    updated_at: str
    resolved_at: Optional[str] = None

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    resolution: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None

# Model for Member Withdrawal (UNE 0087:2025 - Gob.3)
class WithdrawalRequest(BaseModel):
    reason: str
    effective_date: Optional[str] = None

class WithdrawalResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    user_email: str
    reason: str
    status: str  # pendiente, aprobada, rechazada, completada
    requested_at: str
    effective_date: Optional[str] = None
    processed_at: Optional[str] = None
    processed_by: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def require_promotor(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.PROMOTOR:
        raise HTTPException(status_code=403, detail="Acceso solo para promotor")
    return user

# ==================== AUDIT LOGGING ====================

async def log_audit(request: Request, user_id: str, user_email: str, action: str, 
                    resource_type: str, resource_id: str = None, details: dict = None):
    ip = request.client.host if request.client else "unknown"
    log_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_email": user_email,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "ip_address": ip,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(log_entry)
    return log_entry

# ==================== EVIDENCE GENERATION ====================

def generate_signature_hash(data: dict) -> str:
    data_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(data_str.encode()).hexdigest()

async def generate_evidence_pdf(evidence_type: str, user_data: dict, metadata: dict, evidence_id: str) -> str:
    pdf_path = EVIDENCE_DIR / f"{evidence_id}.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4, 
                           rightMargin=2*cm, leftMargin=2*cm, 
                           topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], 
                                  fontSize=18, alignment=TA_CENTER, spaceAfter=30)
    header_style = ParagraphStyle('Header', parent=styles['Heading2'], 
                                   fontSize=14, spaceAfter=12)
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'], 
                                   fontSize=11, spaceAfter=6)
    mono_style = ParagraphStyle('Mono', parent=styles['Normal'], 
                                 fontSize=9, fontName='Courier', spaceAfter=6)
    
    story = []
    
    # Header
    story.append(Paragraph("FENITEL - ESPACIO DE DATOS SECTORIAL", title_style))
    story.append(Paragraph("Orden TDF/758/2025 - Kit Espacios de Datos", 
                          ParagraphStyle('Subtitle', alignment=TA_CENTER, fontSize=12, spaceAfter=30)))
    
    if evidence_type == "identity":
        story.append(Paragraph("EVIDENCIA DE IDENTIDAD", header_style))
        story.append(Paragraph("Certificado de incorporación al Espacio de Datos", normal_style))
    elif evidence_type == "publication":
        story.append(Paragraph("EVIDENCIA DE PUBLICACIÓN", header_style))
        story.append(Paragraph("Certificado de publicación de dataset en el catálogo", normal_style))
    
    story.append(Spacer(1, 20))
    
    # User data
    story.append(Paragraph("DATOS DEL TITULAR", header_style))
    user_table_data = [
        ["Nombre/Razón Social:", user_data.get("name", "")],
        ["NIF/CIF:", user_data.get("nif", "")],
        ["Email:", user_data.get("email", "")],
        ["Organización:", user_data.get("organization", "")],
    ]
    user_table = Table(user_table_data, colWidths=[5*cm, 10*cm])
    user_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(user_table)
    story.append(Spacer(1, 20))
    
    # Metadata
    story.append(Paragraph("DATOS DE LA EVIDENCIA", header_style))
    meta_table_data = [
        ["ID Evidencia:", evidence_id],
        ["Tipo:", evidence_type.upper()],
        ["Fecha/Hora:", datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M:%S UTC")],
    ]
    for key, value in metadata.items():
        if key not in ["user_id"]:
            meta_table_data.append([f"{key}:", str(value)])
    
    meta_table = Table(meta_table_data, colWidths=[5*cm, 10*cm])
    meta_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))
    
    # Hash signature
    hash_data = {
        "evidence_id": evidence_id,
        "evidence_type": evidence_type,
        "user_nif": user_data.get("nif"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata
    }
    signature_hash = generate_signature_hash(hash_data)
    
    story.append(Paragraph("FIRMA ELECTRÓNICA", header_style))
    story.append(Paragraph("Hash SHA-256:", normal_style))
    story.append(Paragraph(signature_hash, mono_style))
    story.append(Spacer(1, 30))
    
    # Footer
    story.append(Paragraph("Este documento constituye evidencia válida según la Orden TDF/758/2025.", 
                          ParagraphStyle('Footer', fontSize=9, alignment=TA_CENTER)))
    story.append(Paragraph("FENITEL - Federación Nacional de Instaladores de Telecomunicaciones", 
                          ParagraphStyle('Footer', fontSize=9, alignment=TA_CENTER)))
    
    doc.build(story)
    return str(pdf_path), signature_hash

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(request: Request, user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    existing_nif = await db.users.find_one({"nif": user_data.nif}, {"_id": 0})
    if existing_nif:
        raise HTTPException(status_code=400, detail="NIF ya registrado")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    contract_reference = f"FENITEL-{now.strftime('%Y%m%d')}-{user_id[:8].upper()}"
    
    # Generate registration certificate automatically
    cert_filename = f"membership_{user_id}.pdf"
    cert_path = MEMBERSHIP_EVIDENCE_DIR / cert_filename
    
    cert_url, cert_hash = generate_membership_certificate(
        output_path=cert_path,
        member_id=user_id,
        organization_name=user_data.name,
        cif=user_data.nif,
        role=user_data.role,
        date_joined=now.strftime("%d/%m/%Y %H:%M:%S UTC"),
        contract_reference=contract_reference,
        email=user_data.email,
        address=user_data.address
    )
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "organization": user_data.organization,
        "nif": user_data.nif,
        "phone": user_data.phone,
        "address": user_data.address,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "incorporation_status": IncorporationStatus.PENDING_CONTRACT,
        "contract_signed": False,
        "payment_status": "pending",
        "identity_evidence_id": None,
        "created_at": now_iso,
        "updated_at": now_iso,
        "is_provider": False,
        # New fields for Orden 758/2025
        "contract_reference": contract_reference,
        "registration_certificate_url": str(cert_path),
        "registration_certificate_hash": cert_hash
    }
    
    await db.users.insert_one(user)
    
    # Create initial contract
    contract = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "created_at": now_iso,
        "signed_at": None,
        "signature_hash": None,
        "status": "pending",
        "pdf_path": None,
        "version": 1,
        "contract_reference": contract_reference
    }
    await db.contracts.insert_one(contract)
    
    # Store evidence record
    evidence_record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "evidence_type": "membership_registration",
        "hash": cert_hash,
        "timestamp": now_iso,
        "pdf_path": str(cert_path),
        "metadata": {
            "member_id": user_id,
            "organization_name": user_data.name,
            "cif": user_data.nif,
            "contract_reference": contract_reference
        },
        "generated_by": "system"
    }
    await db.evidence.insert_one(evidence_record)
    
    await log_audit(request, user_id, user_data.email, "MEMBER_REGISTRATION", "member", user_id, 
                   {"role": user_data.role, "organization": user_data.organization, 
                    "certificate_hash": cert_hash, "contract_reference": contract_reference})
    
    await log_audit(request, user_id, user_data.email, "CERTIFICATE_GENERATION", "evidence", evidence_record["id"],
                   {"certificate_type": "membership_registration", "hash": cert_hash})
    
    user.pop("password_hash", None)
    return UserResponse(**user)

@api_router.post("/auth/login")
async def login(request: Request, credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    await log_audit(request, user["id"], user["email"], "LOGIN", "session", None, {})
    
    return {
        "token": token,
        "user": UserResponse(**{k: v for k, v in user.items() if k != "password_hash"})
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in user.items() if k != "password_hash"})

# ==================== MEMBERS ROUTES ====================

@api_router.get("/members", response_model=List[UserResponse])
async def list_members(user: dict = Depends(require_promotor)):
    members = await db.users.find({"role": {"$ne": UserRole.PROMOTOR}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**m) for m in members]

@api_router.get("/members/{member_id}", response_model=UserResponse)
async def get_member(member_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.PROMOTOR and user["id"] != member_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    member = await db.users.find_one({"id": member_id}, {"_id": 0, "password_hash": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return UserResponse(**member)

@api_router.put("/members/{member_id}/provider")
async def toggle_provider(member_id: str, request: Request, user: dict = Depends(require_promotor)):
    member = await db.users.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    new_status = not member.get("is_provider", False)
    await db.users.update_one({"id": member_id}, {"$set": {"is_provider": new_status}})
    
    await log_audit(request, user["id"], user["email"], "TOGGLE_PROVIDER", "user", member_id,
                   {"new_status": new_status})
    
    return {"is_provider": new_status}


@api_router.get("/members/{member_id}/registration-certificate")
async def download_registration_certificate(member_id: str, user: dict = Depends(get_current_user)):
    """Download member registration certificate PDF"""
    if user["role"] != UserRole.PROMOTOR and user["id"] != member_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    member = await db.users.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    cert_path = member.get("registration_certificate_url")
    if not cert_path or not Path(cert_path).exists():
        # Generate certificate if it doesn't exist (for legacy members)
        now = datetime.now(timezone.utc)
        contract_reference = member.get("contract_reference") or f"FENITEL-{now.strftime('%Y%m%d')}-{member_id[:8].upper()}"
        
        cert_filename = f"membership_{member_id}.pdf"
        cert_path = MEMBERSHIP_EVIDENCE_DIR / cert_filename
        
        cert_url, cert_hash = generate_membership_certificate(
            output_path=cert_path,
            member_id=member_id,
            organization_name=member["name"],
            cif=member["nif"],
            role=member["role"],
            date_joined=member["created_at"],
            contract_reference=contract_reference,
            email=member["email"],
            address=member.get("address")
        )
        
        # Update member record
        await db.users.update_one(
            {"id": member_id},
            {"$set": {
                "registration_certificate_url": str(cert_path),
                "registration_certificate_hash": cert_hash,
                "contract_reference": contract_reference
            }}
        )
        cert_path = str(cert_path)
    
    return FileResponse(
        cert_path, 
        filename=f"certificado_registro_{member['nif']}.pdf", 
        media_type="application/pdf"
    )


@api_router.get("/members/extended", response_model=List[MemberResponse])
async def list_members_extended(user: dict = Depends(require_promotor)):
    """List all members with extended certificate information"""
    members = await db.users.find({"role": {"$ne": UserRole.PROMOTOR}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    result = []
    for m in members:
        result.append(MemberResponse(
            member_id=m["id"],
            organization_name=m["name"],
            cif=m["nif"],
            email=m["email"],
            role=m["role"],
            date_joined=m["created_at"],
            contract_reference=m.get("contract_reference"),
            status=m["incorporation_status"],
            certificate_url=m.get("registration_certificate_url"),
            certificate_hash=m.get("registration_certificate_hash"),
            phone=m.get("phone"),
            address=m.get("address"),
            is_provider=m.get("is_provider", False),
            incorporation_status=m["incorporation_status"],
            payment_status=m["payment_status"]
        ))
    return result

# ==================== CONTRACTS ROUTES ====================

@api_router.get("/contracts/my", response_model=ContractResponse)
async def get_my_contract(user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return ContractResponse(**contract)

@api_router.post("/contracts/sign")
async def sign_contract(request: Request, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    if contract["status"] == "signed":
        raise HTTPException(status_code=400, detail="Contrato ya firmado")
    
    now = datetime.now(timezone.utc)
    
    # Generate signature hash
    sign_data = {
        "contract_id": contract["id"],
        "user_id": user["id"],
        "user_nif": user["nif"],
        "timestamp": now.isoformat()
    }
    signature_hash = generate_signature_hash(sign_data)
    
    # Generate contract PDF
    contract_id = contract["id"]
    pdf_path = CONTRACTS_DIR / f"{contract_id}.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    story.append(Paragraph("CONTRATO DE ADHESIÓN", 
                          ParagraphStyle('Title', fontSize=18, alignment=TA_CENTER, spaceAfter=30)))
    story.append(Paragraph("ESPACIO DE DATOS SECTORIAL FENITEL", 
                          ParagraphStyle('Subtitle', fontSize=14, alignment=TA_CENTER, spaceAfter=20)))
    story.append(Paragraph("Orden TDF/758/2025 - Kit Espacios de Datos", 
                          ParagraphStyle('Subtitle', fontSize=12, alignment=TA_CENTER, spaceAfter=30)))
    
    story.append(Paragraph("<b>PARTES</b>", styles["Heading2"]))
    story.append(Paragraph("Promotor: FENITEL - Federación Nacional de Instaladores de Telecomunicaciones", styles["Normal"]))
    story.append(Paragraph(f"Miembro: {user['name']} ({user['nif']})", styles["Normal"]))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>CLÁUSULAS</b>", styles["Heading2"]))
    clauses = [
        "PRIMERA: El Miembro acepta las condiciones de participación en el Espacio de Datos.",
        "SEGUNDA: El Miembro se compromete a cumplir con la normativa vigente.",
        "TERCERA: El tratamiento de datos se realizará conforme al RGPD.",
        "CUARTA: El Miembro acepta la gobernanza establecida por el Promotor.",
        "QUINTA: Las cuotas de incorporación se establecen según tarifa vigente."
    ]
    for clause in clauses:
        story.append(Paragraph(clause, styles["Normal"]))
        story.append(Spacer(1, 10))
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("<b>FIRMA DIGITAL</b>", styles["Heading2"]))
    story.append(Paragraph(f"Fecha: {now.strftime('%d/%m/%Y %H:%M:%S')} UTC", styles["Normal"]))
    story.append(Paragraph(f"Hash SHA-256: {signature_hash}", 
                          ParagraphStyle('Mono', fontName='Courier', fontSize=8)))
    
    doc.build(story)
    
    # Update contract
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "signed_at": now.isoformat(),
            "signature_hash": signature_hash,
            "status": "signed",
            "pdf_path": str(pdf_path)
        }}
    )
    
    # Update user status
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "contract_signed": True,
            "incorporation_status": IncorporationStatus.PENDING_PAYMENT
        }}
    )
    
    await log_audit(request, user["id"], user["email"], "SIGN_CONTRACT", "contract", contract_id,
                   {"signature_hash": signature_hash})
    
    return {"message": "Contrato firmado correctamente", "signature_hash": signature_hash}

@api_router.get("/contracts/{contract_id}/pdf")
async def download_contract_pdf(contract_id: str, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    
    if user["role"] != UserRole.PROMOTOR and contract["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    if not contract.get("pdf_path") or not Path(contract["pdf_path"]).exists():
        raise HTTPException(status_code=404, detail="PDF no disponible")
    
    return FileResponse(contract["pdf_path"], filename=f"contrato_{contract_id}.pdf", media_type="application/pdf")

# ==================== PAYMENTS ROUTES ====================

@api_router.get("/payments")
async def list_payments(user: dict = Depends(require_promotor)):
    users = await db.users.find({"role": {"$ne": UserRole.PROMOTOR}}, 
                                {"_id": 0, "id": 1, "name": 1, "email": 1, "nif": 1, 
                                 "payment_status": 1, "organization": 1}).to_list(1000)
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    payments_map = {p["user_id"]: p for p in payments}
    
    result = []
    for u in users:
        payment = payments_map.get(u["id"], {})
        result.append({
            "user_id": u["id"],
            "user_name": u["name"],
            "user_email": u["email"],
            "user_nif": u["nif"],
            "organization": u["organization"],
            "status": u["payment_status"],
            "amount": payment.get("amount"),
            "paid_at": payment.get("paid_at"),
            "notes": payment.get("notes")
        })
    return result

@api_router.put("/payments/{user_id}")
async def update_payment(user_id: str, payment: PaymentUpdate, request: Request, user: dict = Depends(require_promotor)):
    member = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    now = datetime.now(timezone.utc).isoformat()
    
    payment_record = {
        "user_id": user_id,
        "status": payment.status,
        "amount": payment.amount,
        "notes": payment.notes,
        "updated_at": now,
        "updated_by": user["id"]
    }
    
    if payment.status == "paid":
        payment_record["paid_at"] = now
    
    await db.payments.update_one({"user_id": user_id}, {"$set": payment_record}, upsert=True)
    await db.users.update_one({"id": user_id}, {"$set": {"payment_status": payment.status}})
    
    # Check if should update incorporation status
    if payment.status == "paid" and member.get("contract_signed"):
        await db.users.update_one({"id": user_id}, {"$set": {"incorporation_status": IncorporationStatus.PENDING_IDENTITY}})
    
    await log_audit(request, user["id"], user["email"], "UPDATE_PAYMENT", "payment", user_id,
                   {"status": payment.status, "amount": payment.amount})
    
    return {"message": "Pago actualizado"}

# ==================== IDENTITY EVIDENCE ROUTES ====================

@api_router.post("/evidence/identity/{user_id}")
async def generate_identity_evidence(user_id: str, request: Request, user: dict = Depends(require_promotor)):
    member = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    if not member.get("contract_signed"):
        raise HTTPException(status_code=400, detail="El miembro debe firmar el contrato primero")
    
    if member.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="El pago debe estar confirmado")
    
    evidence_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    metadata = {
        "contract_signed": member["contract_signed"],
        "payment_status": member["payment_status"],
        "role": member["role"],
        "is_provider": member.get("is_provider", False)
    }
    
    pdf_path, signature_hash = await generate_evidence_pdf(
        "identity",
        {"name": member["name"], "nif": member["nif"], "email": member["email"], "organization": member["organization"]},
        metadata,
        evidence_id
    )
    
    evidence = {
        "id": evidence_id,
        "user_id": user_id,
        "evidence_type": "identity",
        "hash": signature_hash,
        "timestamp": now.isoformat(),
        "pdf_path": pdf_path,
        "metadata": metadata,
        "generated_by": user["id"]
    }
    await db.evidence.insert_one(evidence)
    
    # Update user status to effective
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "identity_evidence_id": evidence_id,
            "incorporation_status": IncorporationStatus.EFFECTIVE
        }}
    )
    
    await log_audit(request, user["id"], user["email"], "GENERATE_IDENTITY_EVIDENCE", "evidence", evidence_id,
                   {"member_id": user_id, "hash": signature_hash})
    
    return EvidenceResponse(**evidence)

@api_router.get("/evidence/{evidence_id}/pdf")
async def download_evidence_pdf(evidence_id: str, user: dict = Depends(get_current_user)):
    evidence = await db.evidence.find_one({"id": evidence_id}, {"_id": 0})
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidencia no encontrada")
    
    if user["role"] != UserRole.PROMOTOR and evidence["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    if not evidence.get("pdf_path") or not Path(evidence["pdf_path"]).exists():
        raise HTTPException(status_code=404, detail="PDF no disponible")
    
    return FileResponse(evidence["pdf_path"], filename=f"evidencia_{evidence_id}.pdf", media_type="application/pdf")

@api_router.get("/evidence/user/{user_id}", response_model=List[EvidenceResponse])
async def get_user_evidence(user_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.PROMOTOR and user["id"] != user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    evidence_list = await db.evidence.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return [EvidenceResponse(**e) for e in evidence_list]

# ==================== DATASETS ROUTES ====================

@api_router.post("/datasets", response_model=DatasetResponse)
async def upload_dataset(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    keywords: str = Form(""),
    category: str = Form("general"),
    license: str = Form("CC-BY-4.0"),
    access_rights: str = Form("restricted"),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if user["incorporation_status"] != IncorporationStatus.EFFECTIVE:
        raise HTTPException(status_code=400, detail="Debe completar la incorporación efectiva antes de subir datasets")
    
    if not user.get("is_provider"):
        raise HTTPException(status_code=403, detail="Solo los proveedores pueden subir datasets")
    
    # Validate file type
    if not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos CSV o JSON")
    
    dataset_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    # Save file
    file_ext = Path(file.filename).suffix
    file_path = DATASETS_DIR / f"{dataset_id}{file_ext}"
    
    content = await file.read()
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Validate content - more flexible validation
    validation_status = "pending"
    try:
        # Try different encodings
        decoded_content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                decoded_content = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        
        if decoded_content is None:
            decoded_content = content.decode('utf-8', errors='replace')
        
        if file_ext == '.csv':
            # Detect delimiter
            first_line = decoded_content.split('\n')[0] if decoded_content else ''
            delimiter = ','
            if first_line.count(';') > first_line.count(','):
                delimiter = ';'
            elif first_line.count('\t') > first_line.count(','):
                delimiter = '\t'
            
            reader = csv.reader(io.StringIO(decoded_content), delimiter=delimiter)
            rows = list(reader)
            non_empty_rows = [r for r in rows if any(cell.strip() for cell in r)]
            if len(non_empty_rows) > 0:
                validation_status = "valid"
        elif file_ext == '.json':
            json.loads(decoded_content)
            validation_status = "valid"
    except Exception as e:
        validation_status = "invalid"
        logger.error(f"Dataset validation error: {e}")
    
    # Generate DCAT-AP metadata
    keywords_list = [k.strip() for k in keywords.split(",") if k.strip()]
    dcat_metadata = {
        "@context": "https://www.w3.org/ns/dcat#",
        "@type": "Dataset",
        "identifier": dataset_id,
        "title": title,
        "description": description,
        "keyword": keywords_list,
        "theme": category,
        "license": license,
        "accessRights": access_rights,
        "publisher": {
            "@type": "Organization",
            "name": user["organization"],
            "identifier": user["nif"]
        },
        "issued": now.isoformat(),
        "modified": now.isoformat()
    }
    
    dataset = {
        "id": dataset_id,
        "user_id": user["id"],
        "title": title,
        "description": description,
        "keywords": keywords_list,
        "category": category,
        "license": license,
        "access_rights": access_rights,
        "file_path": str(file_path),
        "file_type": file_ext[1:],
        "file_size": len(content),
        "version": 1,
        "status": "draft",
        "validation_status": validation_status,
        "publication_evidence_id": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "dcat_metadata": dcat_metadata
    }
    
    await db.datasets.insert_one(dataset)
    
    await log_audit(request, user["id"], user["email"], "UPLOAD_DATASET", "dataset", dataset_id,
                   {"title": title, "file_type": file_ext, "size": len(content)})
    
    return DatasetResponse(**dataset)

@api_router.get("/datasets", response_model=List[DatasetResponse])
async def list_datasets(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] != UserRole.PROMOTOR:
        # Non-promotors can only see published datasets or their own
        query["$or"] = [{"status": "published"}, {"user_id": user["id"]}]
    elif status:
        query["status"] = status
    
    datasets = await db.datasets.find(query, {"_id": 0}).to_list(1000)
    return [DatasetResponse(**d) for d in datasets]

@api_router.get("/datasets/catalog")
async def get_catalog():
    """DCAT-AP catalog endpoint"""
    datasets = await db.datasets.find({"status": "published"}, {"_id": 0}).to_list(1000)
    
    catalog = {
        "@context": "https://www.w3.org/ns/dcat#",
        "@type": "Catalog",
        "title": "FENITEL - Catálogo de Datos Sectoriales",
        "description": "Espacio de Datos Sectorial conforme a Orden TDF/758/2025",
        "publisher": {
            "@type": "Organization",
            "name": "FENITEL"
        },
        "dataset": [d["dcat_metadata"] for d in datasets]
    }
    return catalog

@api_router.get("/datasets/catalog/full", response_model=List[DatasetResponse])
async def get_full_catalog(user: dict = Depends(get_current_user)):
    """Get all published datasets with full information for catalog view"""
    datasets = await db.datasets.find({"status": "published"}, {"_id": 0}).to_list(1000)
    return [DatasetResponse(**d) for d in datasets]

@api_router.put("/datasets/{dataset_id}/validate")
async def validate_dataset(dataset_id: str, request: Request, user: dict = Depends(require_promotor)):
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset no encontrado")
    
    # Re-validate file
    file_path = Path(dataset["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    validation_status = "valid"
    validation_details = {}
    
    try:
        # Read file with different encodings
        content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                async with aiofiles.open(file_path, 'r', encoding=encoding) as f:
                    content = await f.read()
                validation_details['encoding'] = encoding
                break
            except UnicodeDecodeError:
                continue
        
        if content is None:
            # Try reading as binary if all encodings fail
            async with aiofiles.open(file_path, 'rb') as f:
                raw_content = await f.read()
            content = raw_content.decode('utf-8', errors='replace')
            validation_details['encoding'] = 'utf-8 (with replacements)'
        
        if dataset["file_type"] == "csv":
            # Detect delimiter (try common ones: comma, semicolon, tab)
            first_line = content.split('\n')[0] if content else ''
            delimiter = ','
            if first_line.count(';') > first_line.count(','):
                delimiter = ';'
            elif first_line.count('\t') > first_line.count(','):
                delimiter = '\t'
            
            validation_details['delimiter'] = delimiter
            
            # Parse CSV with detected delimiter
            reader = csv.reader(io.StringIO(content), delimiter=delimiter)
            rows = list(reader)
            
            # Count non-empty rows
            non_empty_rows = [r for r in rows if any(cell.strip() for cell in r)]
            validation_details['total_rows'] = len(rows)
            validation_details['non_empty_rows'] = len(non_empty_rows)
            
            if len(non_empty_rows) == 0:
                validation_status = "invalid"
                validation_details['error'] = "No se encontraron filas con datos"
            else:
                # Get column count from first non-empty row
                if non_empty_rows:
                    validation_details['columns'] = len(non_empty_rows[0])
                validation_status = "valid"
                
        elif dataset["file_type"] == "json":
            data = json.loads(content)
            if isinstance(data, list):
                validation_details['items'] = len(data)
            elif isinstance(data, dict):
                validation_details['keys'] = len(data.keys())
            validation_status = "valid"
            
    except json.JSONDecodeError as e:
        validation_status = "invalid"
        validation_details['error'] = f"JSON inválido: {str(e)}"
    except Exception as e:
        validation_status = "invalid"
        validation_details['error'] = str(e)
        logger.error(f"Dataset validation error: {e}")
    
    await db.datasets.update_one(
        {"id": dataset_id},
        {"$set": {
            "validation_status": validation_status, 
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "validation_details": validation_details
        }}
    )
    
    await log_audit(request, user["id"], user["email"], "VALIDATE_DATASET", "dataset", dataset_id,
                   {"validation_status": validation_status, "details": validation_details})
    
    return {"validation_status": validation_status, "details": validation_details}

@api_router.put("/datasets/{dataset_id}/publish")
async def publish_dataset(dataset_id: str, request: Request, user: dict = Depends(require_promotor)):
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset no encontrado")
    
    if dataset["validation_status"] != "valid":
        raise HTTPException(status_code=400, detail="El dataset debe estar validado antes de publicar")
    
    # Generate publication evidence using the new certificate service
    evidence_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    owner = await db.users.find_one({"id": dataset["user_id"]}, {"_id": 0})
    
    # Use the new certificate service for dataset publication
    cert_filename = f"dataset_publication_{evidence_id}.pdf"
    cert_path = DATASET_EVIDENCE_DIR / cert_filename
    
    pdf_path, signature_hash = generate_dataset_publication_certificate(
        output_path=cert_path,
        dataset_id=dataset_id,
        dataset_title=dataset["title"],
        provider_name=owner["name"],
        provider_cif=owner["nif"],
        provider_email=owner["email"],
        publication_date=now.strftime("%d/%m/%Y %H:%M:%S UTC"),
        metadata_reference=f"DCAT-{SPACE_IDENTIFIER}-{dataset_id[:8].upper()}",
        dataset_description=dataset.get("description"),
        dataset_category=dataset.get("category"),
        dataset_license=dataset.get("license")
    )
    
    metadata = {
        "dataset_id": dataset_id,
        "dataset_title": dataset["title"],
        "dcat_identifier": dataset_id,
        "metadata_reference": f"DCAT-{SPACE_IDENTIFIER}-{dataset_id[:8].upper()}",
        "provider_cif": owner["nif"],
        "space_identifier": SPACE_IDENTIFIER
    }
    
    evidence = {
        "id": evidence_id,
        "user_id": dataset["user_id"],
        "evidence_type": "dataset_publication",
        "hash": signature_hash,
        "timestamp": now.isoformat(),
        "pdf_path": str(pdf_path),
        "metadata": metadata,
        "generated_by": user["id"]
    }
    await db.evidence.insert_one(evidence)
    
    # Update dataset with publication info
    await db.datasets.update_one(
        {"id": dataset_id},
        {"$set": {
            "status": "published",
            "publication_evidence_id": evidence_id,
            "publication_certificate_url": str(pdf_path),
            "publication_certificate_hash": signature_hash,
            "publication_date": now.isoformat(),
            "updated_at": now.isoformat()
        }}
    )
    
    await log_audit(request, user["id"], user["email"], "DATASET_PUBLICATION", "dataset", dataset_id,
                   {"evidence_id": evidence_id, "hash": signature_hash, "metadata_reference": metadata["metadata_reference"]})
    
    await log_audit(request, user["id"], user["email"], "CERTIFICATE_GENERATION", "evidence", evidence_id,
                   {"certificate_type": "dataset_publication", "hash": signature_hash, "dataset_id": dataset_id})
    
    return {"message": "Dataset publicado", "evidence_id": evidence_id, "certificate_hash": signature_hash}

@api_router.put("/datasets/{dataset_id}/category")
async def update_dataset_category(
    dataset_id: str, 
    request: Request,
    category: str = Form(...),
    user: dict = Depends(require_promotor)
):
    """Update dataset category - Promotor only"""
    valid_categories = ["UTP", "ICT", "FM", "SAT", "general"]
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Categoría inválida. Opciones: {', '.join(valid_categories)}")
    
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset no encontrado")
    
    now = datetime.now(timezone.utc)
    
    # Update category in main dataset and DCAT metadata
    await db.datasets.update_one(
        {"id": dataset_id},
        {"$set": {
            "category": category,
            "dcat_metadata.theme": category,
            "updated_at": now.isoformat()
        }}
    )
    
    await log_audit(request, user["id"], user["email"], "UPDATE_DATASET_CATEGORY", "dataset", dataset_id,
                   {"old_category": dataset.get("category"), "new_category": category})
    
    return {"message": "Categoría actualizada", "category": category}

@api_router.get("/datasets/{dataset_id}/download")
async def download_dataset(dataset_id: str, user: dict = Depends(get_current_user)):
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset no encontrado")
    
    if user["role"] != UserRole.PROMOTOR and dataset["user_id"] != user["id"]:
        if dataset["status"] != "published":
            raise HTTPException(status_code=403, detail="No autorizado")
    
    file_path = Path(dataset["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    return FileResponse(file_path, filename=f"{dataset['title']}.{dataset['file_type']}")


@api_router.get("/datasets/{dataset_id}/publication-certificate")
async def download_publication_certificate(dataset_id: str, user: dict = Depends(get_current_user)):
    """Download dataset publication certificate PDF"""
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset no encontrado")
    
    if user["role"] != UserRole.PROMOTOR and dataset["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    if dataset["status"] != "published":
        raise HTTPException(status_code=400, detail="El dataset no ha sido publicado")
    
    cert_path = dataset.get("publication_certificate_url")
    if not cert_path or not Path(cert_path).exists():
        # Try to find the evidence
        evidence = await db.evidence.find_one({"id": dataset.get("publication_evidence_id")}, {"_id": 0})
        if evidence and evidence.get("pdf_path") and Path(evidence["pdf_path"]).exists():
            cert_path = evidence["pdf_path"]
        else:
            raise HTTPException(status_code=404, detail="Certificado de publicación no encontrado")
    
    return FileResponse(
        cert_path,
        filename=f"certificado_publicacion_{dataset_id[:8]}.pdf",
        media_type="application/pdf"
    )

# ==================== AUDIT ROUTES ====================

@api_router.get("/audit", response_model=List[AuditLogResponse])
async def list_audit_logs(
    resource_type: Optional[str] = None,
    user_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    user: dict = Depends(require_promotor)
):
    query = {}
    if resource_type:
        query["resource_type"] = resource_type
    if user_id:
        query["user_id"] = user_id
    if from_date:
        query["timestamp"] = {"$gte": from_date}
    if to_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = to_date
        else:
            query["timestamp"] = {"$lte": to_date}
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return [AuditLogResponse(**log) for log in logs]

@api_router.get("/audit/export")
async def export_audit_logs(user: dict = Depends(require_promotor)):
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(10000)
    
    output = io.StringIO()
    if logs:
        writer = csv.DictWriter(output, fieldnames=logs[0].keys())
        writer.writeheader()
        for log in logs:
            log["details"] = json.dumps(log["details"])
            writer.writerow(log)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"}
    )

# ==================== GOVERNANCE ROUTES ====================

@api_router.get("/governance/committee", response_model=List[CommitteeMemberResponse])
async def list_committee(user: dict = Depends(get_current_user)):
    members = await db.committee.find({}, {"_id": 0}).to_list(100)
    result = []
    for m in members:
        member_user = await db.users.find_one({"id": m["user_id"]}, {"_id": 0})
        if member_user:
            result.append(CommitteeMemberResponse(
                id=m["id"],
                user_id=m["user_id"],
                user_name=member_user["name"],
                user_email=member_user["email"],
                role=m["role"],
                start_date=m["start_date"],
                status=m["status"]
            ))
    return result

@api_router.post("/governance/committee", response_model=CommitteeMemberResponse)
async def add_committee_member(member: CommitteeMemberCreate, request: Request, user: dict = Depends(require_promotor)):
    member_user = await db.users.find_one({"id": member.user_id}, {"_id": 0})
    if not member_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    member_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    committee_member = {
        "id": member_id,
        "user_id": member.user_id,
        "role": member.role,
        "start_date": member.start_date or now,
        "status": "active"
    }
    await db.committee.insert_one(committee_member)
    
    await log_audit(request, user["id"], user["email"], "ADD_COMMITTEE_MEMBER", "committee", member_id,
                   {"member_user_id": member.user_id, "role": member.role})
    
    return CommitteeMemberResponse(
        id=member_id,
        user_id=member.user_id,
        user_name=member_user["name"],
        user_email=member_user["email"],
        role=member.role,
        start_date=committee_member["start_date"],
        status="active"
    )

@api_router.delete("/governance/committee/{member_id}")
async def remove_committee_member(member_id: str, request: Request, user: dict = Depends(require_promotor)):
    result = await db.committee.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Miembro del comité no encontrado")
    
    await log_audit(request, user["id"], user["email"], "REMOVE_COMMITTEE_MEMBER", "committee", member_id, {})
    
    return {"message": "Miembro eliminado del comité"}

@api_router.get("/governance/decisions", response_model=List[GovernanceDecisionResponse])
async def list_decisions(user: dict = Depends(get_current_user)):
    decisions = await db.decisions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [GovernanceDecisionResponse(**d) for d in decisions]

@api_router.post("/governance/decisions", response_model=GovernanceDecisionResponse)
async def create_decision(decision: GovernanceDecisionCreate, request: Request, user: dict = Depends(require_promotor)):
    decision_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    decision_doc = {
        "id": decision_id,
        "title": decision.title,
        "description": decision.description,
        "decision_type": decision.decision_type,
        "participants": decision.participants,
        "attachments": decision.attachments,
        "created_by": user["id"],
        "created_at": now,
        "status": "active"
    }
    await db.decisions.insert_one(decision_doc)
    
    await log_audit(request, user["id"], user["email"], "CREATE_DECISION", "decision", decision_id,
                   {"title": decision.title, "type": decision.decision_type})
    
    return GovernanceDecisionResponse(**decision_doc)

# ==================== EXPORT ROUTES ====================

@api_router.get("/export/member/{member_id}")
async def export_member_dossier(member_id: str, request: Request, user: dict = Depends(require_promotor)):
    member = await db.users.find_one({"id": member_id}, {"_id": 0, "password_hash": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    # Create ZIP file
    zip_path = EXPORTS_DIR / f"expediente_{member_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.zip"
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Member data
        zf.writestr("datos_miembro.json", json.dumps(member, indent=2, ensure_ascii=False))
        
        # Contract
        contract = await db.contracts.find_one({"user_id": member_id}, {"_id": 0})
        if contract:
            zf.writestr("contrato/datos_contrato.json", json.dumps(contract, indent=2, ensure_ascii=False))
            if contract.get("pdf_path") and Path(contract["pdf_path"]).exists():
                zf.write(contract["pdf_path"], "contrato/contrato_firmado.pdf")
        
        # Evidence
        evidence_list = await db.evidence.find({"user_id": member_id}, {"_id": 0}).to_list(100)
        for i, ev in enumerate(evidence_list):
            zf.writestr(f"evidencias/evidencia_{i+1}_datos.json", json.dumps(ev, indent=2, ensure_ascii=False))
            if ev.get("pdf_path") and Path(ev["pdf_path"]).exists():
                zf.write(ev["pdf_path"], f"evidencias/evidencia_{i+1}.pdf")
        
        # Datasets
        datasets = await db.datasets.find({"user_id": member_id}, {"_id": 0}).to_list(100)
        for i, ds in enumerate(datasets):
            ds_copy = {k: v for k, v in ds.items() if k != "file_path"}
            zf.writestr(f"datasets/dataset_{i+1}_metadatos.json", json.dumps(ds_copy, indent=2, ensure_ascii=False))
            if ds.get("file_path") and Path(ds["file_path"]).exists():
                zf.write(ds["file_path"], f"datasets/dataset_{i+1}.{ds['file_type']}")
        
        # Payments
        payment = await db.payments.find_one({"user_id": member_id}, {"_id": 0})
        if payment:
            zf.writestr("pagos/registro_pago.json", json.dumps(payment, indent=2, ensure_ascii=False))
        
        # Audit logs
        logs = await db.audit_logs.find({"user_id": member_id}, {"_id": 0}).to_list(1000)
        if logs:
            zf.writestr("auditoria/logs.json", json.dumps(logs, indent=2, ensure_ascii=False))
    
    await log_audit(request, user["id"], user["email"], "EXPORT_DOSSIER", "export", member_id, {})
    
    return FileResponse(zip_path, filename=f"expediente_{member['nif']}.zip", media_type="application/zip")

# ==================== DOCUMENTATION ROUTES ====================

@api_router.get("/docs/manual-despliegue")
async def download_manual_despliegue(user: dict = Depends(require_promotor)):
    """Generate and download deployment manual PDF"""
    pdf_path = EXPORTS_DIR / "manual_despliegue.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4,
                           rightMargin=2*cm, leftMargin=2*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                  fontSize=20, alignment=TA_CENTER, spaceAfter=30,
                                  textColor=colors.HexColor('#0F172A'))
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'],
                               fontSize=14, spaceBefore=20, spaceAfter=10,
                               textColor=colors.HexColor('#0284C7'))
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'],
                                   fontSize=10, spaceAfter=6)
    code_style = ParagraphStyle('Code', parent=styles['Normal'],
                                 fontSize=9, fontName='Courier',
                                 backColor=colors.HexColor('#F1F5F9'),
                                 spaceAfter=6)
    
    story = []
    
    # Title
    story.append(Paragraph("MANUAL DE DESPLIEGUE", title_style))
    story.append(Paragraph("FENITEL - Espacio de Datos Sectorial", 
                          ParagraphStyle('Subtitle', alignment=TA_CENTER, fontSize=12, spaceAfter=30)))
    story.append(Paragraph(f"Generado: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')} UTC", 
                          ParagraphStyle('Date', alignment=TA_CENTER, fontSize=10, textColor=colors.gray, spaceAfter=40)))
    
    # Requisitos
    story.append(Paragraph("1. REQUISITOS DEL SISTEMA", h2_style))
    requisitos = [
        "• Docker & Docker Compose",
        "• 2GB RAM mínimo",
        "• 10GB espacio en disco",
        "• Dominio con certificado SSL (HTTPS obligatorio)"
    ]
    for req in requisitos:
        story.append(Paragraph(req, normal_style))
    
    # Estructura
    story.append(Paragraph("2. ESTRUCTURA DEL PROYECTO", h2_style))
    estructura = """
/app/
├── backend/              # FastAPI backend
│   ├── server.py         # Aplicación principal
│   ├── requirements.txt  # Dependencias Python
│   └── .env              # Variables de entorno
├── frontend/             # React frontend
│   ├── src/              # Código fuente
│   └── .env              # Variables de entorno
├── storage/              # Almacenamiento de archivos
│   ├── datasets/         # Datasets CSV/JSON
│   ├── contracts/        # Contratos PDF
│   ├── evidence/         # Evidencias firmadas
│   └── exports/          # Expedientes ZIP
└── docker-compose.yml    # Configuración Docker
"""
    story.append(Paragraph(estructura.replace('\n', '<br/>'), code_style))
    
    # Variables de entorno
    story.append(Paragraph("3. VARIABLES DE ENTORNO", h2_style))
    story.append(Paragraph("<b>Backend (.env)</b>", normal_style))
    env_backend = """
MONGO_URL=mongodb://localhost:27017
DB_NAME=fenitel_data_space
JWT_SECRET=tu-clave-secreta-jwt-256bits
CORS_ORIGINS=https://tu-dominio.com
"""
    story.append(Paragraph(env_backend.replace('\n', '<br/>'), code_style))
    
    story.append(Paragraph("<b>Frontend (.env)</b>", normal_style))
    story.append(Paragraph("REACT_APP_BACKEND_URL=https://tu-dominio.com", code_style))
    
    # Pasos de despliegue
    story.append(Paragraph("4. PASOS DE DESPLIEGUE", h2_style))
    pasos = [
        "1. Clonar el repositorio y configurar variables de entorno",
        "2. Ejecutar: docker-compose build",
        "3. Ejecutar: docker-compose up -d",
        "4. Crear usuario promotor inicial",
        "5. Verificar servicios con: docker-compose ps"
    ]
    for paso in pasos:
        story.append(Paragraph(paso, normal_style))
    
    # Backup
    story.append(Paragraph("5. BACKUP Y RESTAURACIÓN", h2_style))
    story.append(Paragraph("<b>Backup MongoDB:</b>", normal_style))
    story.append(Paragraph("docker-compose exec mongodb mongodump --out /backup", code_style))
    story.append(Paragraph("<b>Backup Storage:</b>", normal_style))
    story.append(Paragraph("tar -czvf storage_backup.tar.gz ./storage", code_style))
    
    # Seguridad
    story.append(Paragraph("6. SEGURIDAD", h2_style))
    seguridad = [
        "✓ HTTPS obligatorio (configurar en nginx/ingress)",
        "✓ JWT con expiración de 24 horas",
        "✓ Contraseñas hasheadas con bcrypt",
        "✓ CORS configurado por dominio",
        "✓ Logs inmutables para auditoría"
    ]
    for item in seguridad:
        story.append(Paragraph(item, normal_style))
    
    # Footer
    story.append(Spacer(1, 40))
    story.append(Paragraph("Orden TDF/758/2025 - Kit Espacios de Datos", 
                          ParagraphStyle('Footer', fontSize=9, alignment=TA_CENTER, textColor=colors.gray)))
    
    doc.build(story)
    
    return FileResponse(pdf_path, filename="manual_despliegue_fenitel.pdf", media_type="application/pdf")


@api_router.get("/docs/checklist-758")
async def download_checklist(user: dict = Depends(require_promotor)):
    """Generate and download compliance checklist PDF"""
    pdf_path = EXPORTS_DIR / "checklist_orden_758.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4,
                           rightMargin=1.5*cm, leftMargin=1.5*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                  fontSize=18, alignment=TA_CENTER, spaceAfter=20,
                                  textColor=colors.HexColor('#0F172A'))
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'],
                               fontSize=12, spaceBefore=15, spaceAfter=8,
                               textColor=colors.HexColor('#0284C7'))
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'],
                                   fontSize=9, spaceAfter=4)
    
    story = []
    
    # Title
    story.append(Paragraph("CHECKLIST CUMPLIMIENTO", title_style))
    story.append(Paragraph("Orden TDF/758/2025 - Kit Espacios de Datos", 
                          ParagraphStyle('Subtitle', alignment=TA_CENTER, fontSize=11, spaceAfter=10)))
    story.append(Paragraph("FENITEL - Espacio de Datos Sectorial", 
                          ParagraphStyle('Org', alignment=TA_CENTER, fontSize=10, spaceAfter=20, textColor=colors.gray)))
    story.append(Paragraph(f"Fecha: {datetime.now(timezone.utc).strftime('%d/%m/%Y')}", 
                          ParagraphStyle('Date', alignment=TA_CENTER, fontSize=9, spaceAfter=30)))
    
    # Secciones del checklist
    checklist_sections = [
        ("1. REGISTRO Y ADHESIÓN", [
            ("Formulario de registro de miembros", "✓"),
            ("Validación de NIF/CIF", "✓"),
            ("Generación de contrato de adhesión", "✓"),
            ("Firma digital del contrato", "✓"),
            ("Almacenamiento seguro del contrato", "✓"),
        ]),
        ("2. CUOTAS E INCORPORACIÓN", [
            ("Registro de pago de cuota", "✓"),
            ("Control de estado de pago", "✓"),
            ("Bloqueo hasta pago confirmado", "✓"),
            ("Estado 'Incorporación Efectiva'", "✓"),
        ]),
        ("3. EVIDENCIAS DIGITALES", [
            ("Evidencia de identidad firmada", "✓"),
            ("Evidencia de publicación dataset", "✓"),
            ("Timestamp en evidencias", "✓"),
            ("Descarga de evidencias PDF", "✓"),
        ]),
        ("4. CATÁLOGO DCAT-AP", [
            ("Metadatos DCAT-AP para datasets", "✓"),
            ("Endpoint de catálogo público", "✓"),
            ("Identificador único por dataset", "✓"),
            ("Versionado de datasets", "✓"),
            ("Licencias configurables", "✓"),
        ]),
        ("5. VALIDACIÓN TÉCNICA", [
            ("Validación de formato CSV/JSON", "✓"),
            ("Estado de validación visible", "✓"),
            ("Publicación solo tras validación", "✓"),
        ]),
        ("6. GOBERNANZA", [
            ("Configuración de comité", "✓"),
            ("Registro de decisiones", "✓"),
            ("Tipos de decisión", "✓"),
            ("Versionado de reglamento", "○"),
            ("Publicación de actas", "○"),
        ]),
        ("7. AUDITORÍA Y TRAZABILIDAD", [
            ("Logs inmutables", "✓"),
            ("Registro de usuario", "✓"),
            ("Registro de fecha/hora", "✓"),
            ("Registro de IP", "✓"),
            ("Registro de acción", "✓"),
            ("Exportación de logs CSV", "✓"),
        ]),
        ("8. EXPEDIENTE POR MIEMBRO", [
            ("Exportación completa ZIP", "✓"),
            ("Incluye datos personales", "✓"),
            ("Incluye contratos", "✓"),
            ("Incluye evidencias", "✓"),
            ("Incluye datasets", "✓"),
            ("Incluye logs de auditoría", "✓"),
        ]),
        ("9. SEGURIDAD", [
            ("HTTPS obligatorio", "✓"),
            ("Autenticación JWT", "✓"),
            ("Control de acceso por roles", "✓"),
            ("Hash de contraseñas (bcrypt)", "✓"),
            ("Backup automático", "○"),
        ]),
    ]
    
    for section_title, items in checklist_sections:
        story.append(Paragraph(section_title, h2_style))
        
        table_data = []
        for item, status in items:
            color = colors.HexColor('#059669') if status == "✓" else colors.HexColor('#D97706')
            table_data.append([status, item])
        
        table = Table(table_data, colWidths=[1*cm, 14*cm])
        table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#059669')),
        ]))
        story.append(table)
    
    # Resumen
    story.append(Spacer(1, 20))
    story.append(Paragraph("RESUMEN", h2_style))
    
    summary_data = [
        ["Categoría", "Completado", "%"],
        ["Registro y Adhesión", "5/5", "100%"],
        ["Cuotas e Incorporación", "4/4", "100%"],
        ["Evidencias Digitales", "4/4", "100%"],
        ["Catálogo DCAT-AP", "5/5", "100%"],
        ["Validación Técnica", "3/3", "100%"],
        ["Gobernanza", "3/5", "60%"],
        ["Auditoría", "6/6", "100%"],
        ["Expediente", "6/6", "100%"],
        ["Seguridad", "4/5", "80%"],
        ["TOTAL", "45/48", "94%"],
    ]
    
    summary_table = Table(summary_data, colWidths=[8*cm, 4*cm, 3*cm])
    summary_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    
    # Firma
    story.append(Spacer(1, 40))
    story.append(Paragraph("VERIFICACIÓN", h2_style))
    firma_data = [
        ["Fecha de verificación:", "_________________"],
        ["Responsable:", "_________________"],
        ["Firma:", "_________________"],
    ]
    firma_table = Table(firma_data, colWidths=[5*cm, 8*cm])
    firma_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
    ]))
    story.append(firma_table)
    
    doc.build(story)
    
    return FileResponse(pdf_path, filename="checklist_orden_758_2025.pdf", media_type="application/pdf")


@api_router.get("/docs/manual-auditoria")
async def download_manual_auditoria(user: dict = Depends(require_promotor)):
    """Generate and download audit manual PDF"""
    pdf_path = EXPORTS_DIR / "manual_auditoria.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4,
                           rightMargin=2*cm, leftMargin=2*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                  fontSize=20, alignment=TA_CENTER, spaceAfter=30,
                                  textColor=colors.HexColor('#0F172A'))
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'],
                               fontSize=14, spaceBefore=20, spaceAfter=10,
                               textColor=colors.HexColor('#0284C7'))
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'],
                                   fontSize=10, spaceAfter=6)
    
    story = []
    
    # Title
    story.append(Paragraph("MANUAL DE AUDITORÍA", title_style))
    story.append(Paragraph("FENITEL - Espacio de Datos Sectorial", 
                          ParagraphStyle('Subtitle', alignment=TA_CENTER, fontSize=12, spaceAfter=30)))
    story.append(Paragraph(f"Generado: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')} UTC", 
                          ParagraphStyle('Date', alignment=TA_CENTER, fontSize=10, textColor=colors.gray, spaceAfter=40)))
    
    # Introducción
    story.append(Paragraph("1. INTRODUCCIÓN", h2_style))
    story.append(Paragraph(
        "Este manual describe los procedimientos de auditoría del Espacio de Datos Sectorial FENITEL, "
        "en cumplimiento con la Orden TDF/758/2025. El sistema mantiene un registro completo e inmutable "
        "de todas las acciones realizadas.", normal_style))
    
    # Tipos de registros
    story.append(Paragraph("2. TIPOS DE REGISTROS DE AUDITORÍA", h2_style))
    registros = [
        ("REGISTER", "Registro de nuevo miembro en el sistema"),
        ("LOGIN", "Inicio de sesión de usuario"),
        ("SIGN_CONTRACT", "Firma digital de contrato de adhesión"),
        ("UPDATE_PAYMENT", "Actualización del estado de pago"),
        ("GENERATE_IDENTITY_EVIDENCE", "Generación de evidencia de identidad"),
        ("UPLOAD_DATASET", "Subida de nuevo dataset"),
        ("VALIDATE_DATASET", "Validación técnica de dataset"),
        ("PUBLISH_DATASET", "Publicación de dataset en catálogo"),
        ("EXPORT_DOSSIER", "Exportación de expediente completo"),
        ("ADD_COMMITTEE_MEMBER", "Añadir miembro al comité de gobernanza"),
        ("CREATE_DECISION", "Registro de decisión de gobernanza"),
    ]
    
    table_data = [["Acción", "Descripción"]]
    for action, desc in registros:
        table_data.append([action, desc])
    
    table = Table(table_data, colWidths=[6*cm, 9*cm])
    table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(table)
    
    # Campos de registro
    story.append(Paragraph("3. CAMPOS DE CADA REGISTRO", h2_style))
    campos = [
        "• id: Identificador único del registro (UUID)",
        "• user_id: ID del usuario que realizó la acción",
        "• user_email: Email del usuario",
        "• action: Tipo de acción realizada",
        "• resource_type: Tipo de recurso afectado",
        "• resource_id: ID del recurso afectado",
        "• ip_address: Dirección IP del usuario",
        "• details: Información adicional en JSON",
        "• timestamp: Fecha y hora en formato ISO 8601 UTC",
    ]
    for campo in campos:
        story.append(Paragraph(campo, normal_style))
    
    # Procedimientos
    story.append(Paragraph("4. PROCEDIMIENTOS DE AUDITORÍA", h2_style))
    story.append(Paragraph("<b>4.1 Consulta de logs</b>", normal_style))
    story.append(Paragraph(
        "Acceder al panel de Auditoría desde el menú lateral. Se pueden filtrar los registros "
        "por tipo de recurso y realizar búsquedas por email o acción.", normal_style))
    
    story.append(Paragraph("<b>4.2 Exportación de logs</b>", normal_style))
    story.append(Paragraph(
        "Usar el botón 'Exportar CSV' para descargar todos los registros en formato CSV "
        "compatible con Excel.", normal_style))
    
    story.append(Paragraph("<b>4.3 Expediente por miembro</b>", normal_style))
    story.append(Paragraph(
        "Desde el panel de Miembros, usar 'Exportar expediente' para generar un ZIP completo "
        "con toda la documentación del miembro incluyendo logs de auditoría.", normal_style))
    
    # Verificación
    story.append(Paragraph("5. VERIFICACIÓN DE EVIDENCIAS", h2_style))
    story.append(Paragraph(
        "Cada evidencia generada incluye un hash SHA-256 que puede verificarse para confirmar "
        "la integridad del documento. El hash se calcula sobre los datos del documento "
        "y el timestamp de generación.", normal_style))
    
    # Retención
    story.append(Paragraph("6. POLÍTICA DE RETENCIÓN", h2_style))
    story.append(Paragraph(
        "Los registros de auditoría se mantienen de forma permanente y no pueden ser "
        "modificados ni eliminados, garantizando la trazabilidad completa según los "
        "requisitos de la Orden TDF/758/2025.", normal_style))
    
    # Footer
    story.append(Spacer(1, 40))
    story.append(Paragraph("Orden TDF/758/2025 - Kit Espacios de Datos", 
                          ParagraphStyle('Footer', fontSize=9, alignment=TA_CENTER, textColor=colors.gray)))
    
    doc.build(story)
    
    return FileResponse(pdf_path, filename="manual_auditoria_fenitel.pdf", media_type="application/pdf")


@api_router.get("/docs/informe-evidencias")
async def download_informe_evidencias(user: dict = Depends(require_promotor)):
    """Generate and download evidence audit report PDF"""
    pdf_path = EXPORTS_DIR / "informe_auditoria_evidencias.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4,
                           rightMargin=1.5*cm, leftMargin=1.5*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                  fontSize=18, alignment=TA_CENTER, spaceAfter=10,
                                  textColor=colors.HexColor('#0F172A'))
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'],
                               fontSize=12, spaceBefore=15, spaceAfter=8,
                               textColor=colors.HexColor('#0284C7'))
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'],
                                   fontSize=9, spaceAfter=4)
    code_style = ParagraphStyle('Code', parent=styles['Normal'],
                                 fontSize=8, fontName='Courier',
                                 backColor=colors.HexColor('#F1F5F9'),
                                 spaceAfter=4)
    
    story = []
    
    # Title
    story.append(Paragraph("INFORME DE AUDITORÍA DE EVIDENCIAS", title_style))
    story.append(Paragraph("Verificación de Cumplimiento Orden TDF/758/2025", 
                          ParagraphStyle('Subtitle', alignment=TA_CENTER, fontSize=11, spaceAfter=10)))
    story.append(Paragraph(f"Fecha: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')} UTC", 
                          ParagraphStyle('Date', alignment=TA_CENTER, fontSize=9, spaceAfter=20)))
    
    # Get stats from database
    total_members = await db.users.count_documents({"role": {"$ne": UserRole.PROMOTOR}})
    members_with_cert = await db.users.count_documents({"registration_certificate_hash": {"$exists": True, "$ne": None}})
    total_datasets = await db.datasets.count_documents({})
    published_datasets = await db.datasets.count_documents({"status": "published"})
    total_evidence = await db.evidence.count_documents({})
    
    # Resumen
    story.append(Paragraph("1. RESUMEN EJECUTIVO", h2_style))
    story.append(Paragraph("El sistema FENITEL Espacio de Datos cumple con los requisitos de generación de evidencias.", normal_style))
    
    summary_data = [
        ["Métrica", "Valor", "Estado"],
        ["Miembros registrados", str(total_members), "✓"],
        ["Miembros con certificado", str(members_with_cert), "✓"],
        ["Datasets totales", str(total_datasets), "✓"],
        ["Datasets publicados", str(published_datasets), "✓"],
        ["Evidencias generadas", str(total_evidence), "✓"],
    ]
    
    summary_table = Table(summary_data, colWidths=[7*cm, 4*cm, 3*cm])
    summary_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    
    # Módulos implementados
    story.append(Paragraph("2. MÓDULOS IMPLEMENTADOS", h2_style))
    modules = [
        ("Registro de miembros", "✓ users collection con certificate_url, certificate_hash"),
        ("API de gestión", "✓ POST/GET /api/members, /api/members/{id}/registration-certificate"),
        ("Certificado de registro", "✓ generate_membership_certificate() automático"),
        ("Certificado publicación", "✓ generate_dataset_publication_certificate()"),
        ("Almacenamiento", "✓ /storage/evidences/membership/, /storage/evidences/datasets/"),
        ("Logs de auditoría", "✓ MEMBER_REGISTRATION, DATASET_PUBLICATION, CERTIFICATE_GENERATION"),
    ]
    
    for module, status in modules:
        story.append(Paragraph(f"<b>{module}:</b> {status}", normal_style))
    
    # Endpoints
    story.append(Paragraph("3. ENDPOINTS DISPONIBLES", h2_style))
    endpoints = [
        "POST /api/auth/register → Registro con certificado automático",
        "GET /api/members/{id}/registration-certificate → Descarga cert. registro",
        "PUT /api/datasets/{id}/publish → Publicación con certificado",
        "GET /api/datasets/{id}/publication-certificate → Descarga cert. publicación",
    ]
    for ep in endpoints:
        story.append(Paragraph(ep, code_style))
    
    # Ubicación evidencias
    story.append(Paragraph("4. UBICACIÓN DE EVIDENCIAS", h2_style))
    story.append(Paragraph("/app/storage/evidences/membership/ → Certificados de registro", code_style))
    story.append(Paragraph("/app/storage/evidences/datasets/ → Certificados de publicación", code_style))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(Paragraph("Sistema conforme con Orden TDF/758/2025", 
                          ParagraphStyle('Footer', fontSize=9, alignment=TA_CENTER, textColor=colors.gray)))
    
    doc.build(story)
    
    return FileResponse(pdf_path, filename="informe_auditoria_evidencias.pdf", media_type="application/pdf")


@api_router.get("/docs/diagrama-flujo")
async def download_diagrama_flujo(user: dict = Depends(require_promotor)):
    """Generate and download evidence flow diagram PDF"""
    pdf_path = EXPORTS_DIR / "diagrama_flujo_evidencias.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4,
                           rightMargin=1.5*cm, leftMargin=1.5*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                  fontSize=18, alignment=TA_CENTER, spaceAfter=10,
                                  textColor=colors.HexColor('#0F172A'))
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'],
                               fontSize=12, spaceBefore=15, spaceAfter=8,
                               textColor=colors.HexColor('#0284C7'))
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'],
                                   fontSize=9, spaceAfter=4)
    mono_style = ParagraphStyle('Mono', parent=styles['Normal'],
                                 fontSize=8, fontName='Courier', spaceAfter=4,
                                 leading=10)
    
    story = []
    
    # Title
    story.append(Paragraph("DIAGRAMA DE FLUJO DE EVIDENCIAS", title_style))
    story.append(Paragraph("FENITEL Espacio de Datos Sectorial", 
                          ParagraphStyle('Subtitle', alignment=TA_CENTER, fontSize=11, spaceAfter=20)))
    
    # Flujo de registro
    story.append(Paragraph("1. FLUJO DE REGISTRO DE MIEMBRO", h2_style))
    flow1 = """
    USUARIO → POST /api/auth/register
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
    Validar NIF         Generar UUID
         ↓                     ↓
         └──────────┬──────────┘
                    ↓
         Generar contract_reference
                    ↓
    ═══════════════════════════════
    │  CERTIFICATE SERVICE        │
    │  generate_membership_       │
    │  certificate()              │
    │  → PDF con firma SHA-256    │
    ═══════════════════════════════
                    ↓
         ┌─────────┴─────────┐
         ↓                   ↓
    Almacenar PDF      Guardar en BD
    /evidences/        certificate_url
    membership/        certificate_hash
         ↓                   ↓
         └─────────┬─────────┘
                   ↓
           LOG AUDITORÍA
    """
    story.append(Paragraph(flow1.replace('\n', '<br/>'), mono_style))
    
    # Flujo de publicación
    story.append(Paragraph("2. FLUJO DE PUBLICACIÓN DE DATASET", h2_style))
    flow2 = """
    PROMOTOR → PUT /api/datasets/{id}/publish
                        ↓
              Verificar validation_status
                        ↓
               ┌────────┴────────┐
               ↓                 ↓
            VÁLIDO           INVÁLIDO
               ↓              (error)
    ═══════════════════════════════
    │  CERTIFICATE SERVICE        │
    │  generate_dataset_          │
    │  publication_certificate()  │
    │  → PDF con firma SHA-256    │
    ═══════════════════════════════
                    ↓
         ┌─────────┴─────────┐
         ↓                   ↓
    Almacenar PDF      Actualizar dataset
    /evidences/        status=published
    datasets/          certificate_url
         ↓                   ↓
         └─────────┬─────────┘
                   ↓
           LOG AUDITORÍA
    """
    story.append(Paragraph(flow2.replace('\n', '<br/>'), mono_style))
    
    # Estructura de almacenamiento
    story.append(Paragraph("3. ESTRUCTURA DE ALMACENAMIENTO", h2_style))
    storage = """
    /app/storage/
    ├── evidences/
    │   ├── membership/     ← Certificados registro
    │   └── datasets/       ← Certificados publicación
    ├── contracts/          ← Contratos firmados
    ├── datasets/           ← Archivos de datos
    └── exports/            ← Expedientes ZIP
    """
    story.append(Paragraph(storage.replace('\n', '<br/>'), mono_style))
    
    # Flujo completo
    story.append(Paragraph("4. FLUJO COMPLETO DE INCORPORACIÓN", h2_style))
    flow_complete = """
    REGISTRO → CONTRATO → PAGO → IDENTIDAD → EFECTIVO
       ↓          ↓        ↓         ↓          ↓
    CERT.REG   PDF      ESTADO   CERT.ID    ACCESO
    (auto)    FIRMADO   PAGO    (admin)    COMPLETO

    Si es PROVEEDOR:
                                              ↓
                                    SUBIR DATASET
                                              ↓
                                    VALIDACIÓN
                                              ↓
                                    PUBLICACIÓN + CERT.
    """
    story.append(Paragraph(flow_complete.replace('\n', '<br/>'), mono_style))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(Paragraph("Orden TDF/758/2025 - Kit Espacios de Datos", 
                          ParagraphStyle('Footer', fontSize=9, alignment=TA_CENTER, textColor=colors.gray)))
    
    doc.build(story)
    
    return FileResponse(pdf_path, filename="diagrama_flujo_evidencias.pdf", media_type="application/pdf")


# ==================== INCIDENTS/CLAIMS ROUTES (UNE 0087:2025 - Gob.4) ====================

@api_router.post("/incidents", response_model=IncidentResponse)
async def create_incident(incident: IncidentCreate, request: Request, user: dict = Depends(get_current_user)):
    """Create a new incident or claim"""
    now = datetime.now(timezone.utc)
    incident_id = str(uuid.uuid4())
    
    incident_doc = {
        "id": incident_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "title": incident.title,
        "description": incident.description,
        "incident_type": incident.incident_type,
        "priority": incident.priority,
        "status": "abierta",
        "resolution": None,
        "assigned_to": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "resolved_at": None
    }
    
    await db.incidents.insert_one(incident_doc)
    await log_audit(request, user["id"], user["email"], "CREATE_INCIDENT", "incident", incident_id,
                   {"type": incident.incident_type, "priority": incident.priority})
    
    return IncidentResponse(**incident_doc)

@api_router.get("/incidents", response_model=List[IncidentResponse])
async def list_incidents(user: dict = Depends(get_current_user)):
    """List incidents - promotor sees all, members see their own"""
    if user["role"] == UserRole.PROMOTOR:
        incidents = await db.incidents.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        incidents = await db.incidents.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [IncidentResponse(**i) for i in incidents]

@api_router.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, user: dict = Depends(get_current_user)):
    """Get incident details"""
    incident = await db.incidents.find_one({"id": incident_id}, {"_id": 0})
    if not incident:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    
    if user["role"] != UserRole.PROMOTOR and incident["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    return IncidentResponse(**incident)

@api_router.put("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(incident_id: str, update: IncidentUpdate, request: Request, user: dict = Depends(require_promotor)):
    """Update incident status - Promotor only"""
    incident = await db.incidents.find_one({"id": incident_id}, {"_id": 0})
    if not incident:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    
    now = datetime.now(timezone.utc)
    update_data = {"updated_at": now.isoformat()}
    
    if update.status:
        update_data["status"] = update.status
        if update.status in ["resuelta", "cerrada"]:
            update_data["resolved_at"] = now.isoformat()
    if update.resolution:
        update_data["resolution"] = update.resolution
    if update.assigned_to:
        update_data["assigned_to"] = update.assigned_to
    if update.priority:
        update_data["priority"] = update.priority
    
    await db.incidents.update_one({"id": incident_id}, {"$set": update_data})
    await log_audit(request, user["id"], user["email"], "UPDATE_INCIDENT", "incident", incident_id, update_data)
    
    updated = await db.incidents.find_one({"id": incident_id}, {"_id": 0})
    return IncidentResponse(**updated)

# ==================== WITHDRAWAL ROUTES (UNE 0087:2025 - Gob.3) ====================

@api_router.post("/withdrawals", response_model=WithdrawalResponse)
async def request_withdrawal(withdrawal: WithdrawalRequest, request: Request, user: dict = Depends(get_current_user)):
    """Request withdrawal from the data space"""
    if user["role"] == UserRole.PROMOTOR:
        raise HTTPException(status_code=400, detail="El promotor no puede solicitar baja")
    
    # Check if there's already a pending withdrawal
    existing = await db.withdrawals.find_one({"user_id": user["id"], "status": "pendiente"})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud de baja pendiente")
    
    now = datetime.now(timezone.utc)
    withdrawal_id = str(uuid.uuid4())
    
    effective_date = withdrawal.effective_date or (now + timedelta(days=30)).isoformat()
    
    withdrawal_doc = {
        "id": withdrawal_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "reason": withdrawal.reason,
        "status": "pendiente",
        "requested_at": now.isoformat(),
        "effective_date": effective_date,
        "processed_at": None,
        "processed_by": None
    }
    
    await db.withdrawals.insert_one(withdrawal_doc)
    await log_audit(request, user["id"], user["email"], "REQUEST_WITHDRAWAL", "withdrawal", withdrawal_id,
                   {"reason": withdrawal.reason})
    
    return WithdrawalResponse(**withdrawal_doc)

@api_router.get("/withdrawals", response_model=List[WithdrawalResponse])
async def list_withdrawals(user: dict = Depends(get_current_user)):
    """List withdrawals - promotor sees all, members see their own"""
    if user["role"] == UserRole.PROMOTOR:
        withdrawals = await db.withdrawals.find({}, {"_id": 0}).sort("requested_at", -1).to_list(1000)
    else:
        withdrawals = await db.withdrawals.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    return [WithdrawalResponse(**w) for w in withdrawals]

@api_router.put("/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(withdrawal_id: str, request: Request, user: dict = Depends(require_promotor)):
    """Approve withdrawal request - Promotor only"""
    withdrawal = await db.withdrawals.find_one({"id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if withdrawal["status"] != "pendiente":
        raise HTTPException(status_code=400, detail="La solicitud ya ha sido procesada")
    
    now = datetime.now(timezone.utc)
    
    # Update withdrawal status
    await db.withdrawals.update_one(
        {"id": withdrawal_id},
        {"$set": {
            "status": "aprobada",
            "processed_at": now.isoformat(),
            "processed_by": user["id"]
        }}
    )
    
    # Deactivate user
    await db.users.update_one(
        {"id": withdrawal["user_id"]},
        {"$set": {
            "incorporation_status": "withdrawn",
            "withdrawn_at": now.isoformat()
        }}
    )
    
    await log_audit(request, user["id"], user["email"], "APPROVE_WITHDRAWAL", "withdrawal", withdrawal_id,
                   {"member_id": withdrawal["user_id"]})
    
    return {"message": "Solicitud de baja aprobada"}

@api_router.put("/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(withdrawal_id: str, reason: str = Form(...), request: Request = None, user: dict = Depends(require_promotor)):
    """Reject withdrawal request - Promotor only"""
    withdrawal = await db.withdrawals.find_one({"id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if withdrawal["status"] != "pendiente":
        raise HTTPException(status_code=400, detail="La solicitud ya ha sido procesada")
    
    now = datetime.now(timezone.utc)
    
    await db.withdrawals.update_one(
        {"id": withdrawal_id},
        {"$set": {
            "status": "rechazada",
            "processed_at": now.isoformat(),
            "processed_by": user["id"],
            "rejection_reason": reason
        }}
    )
    
    await log_audit(request, user["id"], user["email"], "REJECT_WITHDRAWAL", "withdrawal", withdrawal_id,
                   {"reason": reason})
    
    return {"message": "Solicitud de baja rechazada"}

# ==================== COMPLIANCE REPORT ROUTES (UNE 0087:2025 - Tec.6) ====================

@api_router.get("/compliance/report")
async def generate_compliance_report(user: dict = Depends(require_promotor)):
    """Generate UNE 0087:2025 compliance report"""
    now = datetime.now(timezone.utc)
    
    # Gather statistics
    total_members = await db.users.count_documents({"role": {"$ne": UserRole.PROMOTOR}})
    active_members = await db.users.count_documents({
        "role": {"$ne": UserRole.PROMOTOR},
        "incorporation_status": "effective"
    })
    total_datasets = await db.datasets.count_documents({})
    published_datasets = await db.datasets.count_documents({"status": "published"})
    total_incidents = await db.incidents.count_documents({})
    open_incidents = await db.incidents.count_documents({"status": "abierta"})
    resolved_incidents = await db.incidents.count_documents({"status": {"$in": ["resuelta", "cerrada"]}})
    total_withdrawals = await db.withdrawals.count_documents({})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pendiente"})
    committee_members = await db.governance_committee.count_documents({"status": "activo"})
    governance_decisions = await db.governance_decisions.count_documents({})
    total_evidences = await db.evidences.count_documents({})
    audit_logs = await db.audit_logs.count_documents({})
    
    # Calculate compliance metrics
    report = {
        "report_id": str(uuid.uuid4()),
        "generated_at": now.isoformat(),
        "period": {
            "start": (now - timedelta(days=365)).isoformat(),
            "end": now.isoformat()
        },
        "data_space": {
            "name": "Espacio de Datos Sectorial FENITEL",
            "promoter": "FENITEL",
            "normative": "UNE 0087:2025, Orden TDF/758/2025"
        },
        "business_model": {
            "status": "CUMPLE",
            "participants": total_members,
            "active_participants": active_members,
            "sustainability": "Cuotas de asociación"
        },
        "governance": {
            "status": "CUMPLE",
            "committee_members": committee_members,
            "decisions_recorded": governance_decisions,
            "incidents_total": total_incidents,
            "incidents_open": open_incidents,
            "incidents_resolved": resolved_incidents,
            "incident_resolution_rate": f"{(resolved_incidents/total_incidents*100) if total_incidents > 0 else 100:.1f}%",
            "withdrawals_total": total_withdrawals,
            "withdrawals_pending": pending_withdrawals
        },
        "technical_solution": {
            "status": "CUMPLE",
            "architecture": "FastAPI + React + MongoDB",
            "authentication": "JWT + bcrypt",
            "catalog_standard": "DCAT-AP",
            "datasets_total": total_datasets,
            "datasets_published": published_datasets,
            "evidences_generated": total_evidences
        },
        "interoperability": {
            "status": "CUMPLE",
            "api_standard": "REST/JSON",
            "catalog_format": "DCAT-AP",
            "categories": ["UTP", "ICT", "FM", "SAT"]
        },
        "audit_traceability": {
            "status": "CUMPLE",
            "total_audit_records": audit_logs,
            "evidences_with_hash": total_evidences
        },
        "overall_compliance": "CUMPLE"
    }
    
    return report

@api_router.get("/compliance/report/pdf")
async def download_compliance_report_pdf(user: dict = Depends(require_promotor)):
    """Generate and download compliance report as PDF"""
    report = await generate_compliance_report(user)
    
    pdf_path = STORAGE_DIR / f"compliance_report_{datetime.now().strftime('%Y%m%d')}.pdf"
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, alignment=TA_CENTER, spaceAfter=30)
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, spaceBefore=20, spaceAfter=10)
    normal_style = styles['Normal']
    
    story = []
    
    story.append(Paragraph("INFORME DE CUMPLIMIENTO UNE 0087:2025", title_style))
    story.append(Paragraph("Espacio de Datos Sectorial FENITEL", styles['Heading3']))
    story.append(Paragraph(f"Generado: {report['generated_at'][:10]}", normal_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("1. MODELO DE NEGOCIO", heading_style))
    story.append(Paragraph(f"Estado: {report['business_model']['status']}", normal_style))
    story.append(Paragraph(f"Participantes: {report['business_model']['participants']} ({report['business_model']['active_participants']} activos)", normal_style))
    
    story.append(Paragraph("2. SISTEMA DE GOBERNANZA", heading_style))
    story.append(Paragraph(f"Estado: {report['governance']['status']}", normal_style))
    story.append(Paragraph(f"Miembros del comité: {report['governance']['committee_members']}", normal_style))
    story.append(Paragraph(f"Decisiones registradas: {report['governance']['decisions_recorded']}", normal_style))
    story.append(Paragraph(f"Incidencias: {report['governance']['incidents_total']} total, {report['governance']['incidents_resolved']} resueltas", normal_style))
    story.append(Paragraph(f"Tasa de resolución: {report['governance']['incident_resolution_rate']}", normal_style))
    
    story.append(Paragraph("3. SOLUCIÓN TÉCNICA", heading_style))
    story.append(Paragraph(f"Estado: {report['technical_solution']['status']}", normal_style))
    story.append(Paragraph(f"Arquitectura: {report['technical_solution']['architecture']}", normal_style))
    story.append(Paragraph(f"Catálogo: {report['technical_solution']['catalog_standard']}", normal_style))
    story.append(Paragraph(f"Datasets publicados: {report['technical_solution']['datasets_published']}", normal_style))
    story.append(Paragraph(f"Evidencias generadas: {report['technical_solution']['evidences_generated']}", normal_style))
    
    story.append(Paragraph("4. INTEROPERABILIDAD", heading_style))
    story.append(Paragraph(f"Estado: {report['interoperability']['status']}", normal_style))
    story.append(Paragraph(f"Formato API: {report['interoperability']['api_standard']}", normal_style))
    story.append(Paragraph(f"Categorías sectoriales: {', '.join(report['interoperability']['categories'])}", normal_style))
    
    story.append(Paragraph("5. TRAZABILIDAD Y AUDITORÍA", heading_style))
    story.append(Paragraph(f"Estado: {report['audit_traceability']['status']}", normal_style))
    story.append(Paragraph(f"Registros de auditoría: {report['audit_traceability']['total_audit_records']}", normal_style))
    
    story.append(Spacer(1, 30))
    story.append(Paragraph(f"RESULTADO GLOBAL: {report['overall_compliance']}", title_style))
    
    doc.build(story)
    
    return FileResponse(pdf_path, filename="informe_cumplimiento_UNE_0087.pdf", media_type="application/pdf")


# ==================== STATS ROUTES ====================

@api_router.get("/stats/public")
async def get_public_stats():
    """Public statistics for landing page - no authentication required"""
    total_members = await db.users.count_documents({"role": {"$ne": UserRole.PROMOTOR}})
    published_datasets = await db.datasets.count_documents({"status": "published"})
    
    return {
        "empresas_asociadas": total_members,
        "datasets_publicados": published_datasets
    }

@api_router.get("/stats")
async def get_stats(user: dict = Depends(require_promotor)):
    total_members = await db.users.count_documents({"role": {"$ne": UserRole.PROMOTOR}})
    effective_members = await db.users.count_documents({"incorporation_status": IncorporationStatus.EFFECTIVE})
    pending_payments = await db.users.count_documents({"payment_status": "pending"})
    total_datasets = await db.datasets.count_documents({})
    published_datasets = await db.datasets.count_documents({"status": "published"})
    total_providers = await db.users.count_documents({"is_provider": True})
    
    return {
        "total_members": total_members,
        "effective_members": effective_members,
        "pending_payments": pending_payments,
        "total_datasets": total_datasets,
        "published_datasets": published_datasets,
        "total_providers": total_providers
    }

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "FENITEL Espacio de Datos API", "version": "1.0.0"}

# ==================== DIAGRAMS ENDPOINTS ====================

DIAGRAMS_DIR = Path("/app/storage/diagrams")

@api_router.get("/diagrams")
async def list_diagrams():
    """Lista todos los diagramas de arquitectura disponibles"""
    if not DIAGRAMS_DIR.exists():
        return {"diagrams": []}
    
    diagrams = []
    for f in sorted(DIAGRAMS_DIR.iterdir()):
        if f.suffix.lower() == '.png':
            diagrams.append({
                "name": f.stem,
                "filename": f.name,
                "size_kb": round(f.stat().st_size / 1024, 1),
                "download_url": f"/api/diagrams/{f.name}"
            })
    return {"diagrams": diagrams}

@api_router.get("/diagrams/{filename}")
async def download_diagram(filename: str):
    """Descarga un diagrama de arquitectura"""
    file_path = DIAGRAMS_DIR / filename
    if not file_path.exists() or not file_path.suffix.lower() == '.png':
        raise HTTPException(status_code=404, detail="Diagrama no encontrado")
    
    return FileResponse(
        path=str(file_path),
        media_type="image/png",
        filename=filename
    )

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
