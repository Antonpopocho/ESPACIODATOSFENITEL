# Sistema de Identificacion y Autenticacion
## Espacio de Datos Sectorial FENITEL

**Version:** 1.0  
**Fecha:** 29/03/2026  
**Referencia normativa:** UNE 0087:2025 (Tec.2, Tec.4), Orden TDF/758/2025

---

## 1. Resumen Ejecutivo

El Espacio de Datos Sectorial FENITEL implementa un sistema robusto de identificacion y autenticacion de participantes y componentes, basado en estandares abiertos y mejores practicas de la industria. El sistema garantiza:

- **Identificacion unica** de cada participante mediante UUID v4
- **Autenticacion segura** mediante JWT (JSON Web Tokens) segun RFC 7519
- **Almacenamiento seguro** de credenciales con bcrypt (factor de coste adaptativo)
- **Trazabilidad completa** mediante logs de auditoria inmutables
- **Evidencias firmadas digitalmente** con hash SHA-256

---

## 2. Arquitectura del Sistema de Autenticacion

```
+------------------+     +-------------------+     +------------------+
|    USUARIO       |     |     API REST      |     |    MONGODB       |
|  (Navegador)     |     |    (FastAPI)      |     |   (Persistencia) |
+------------------+     +-------------------+     +------------------+
        |                        |                        |
        | 1. POST /auth/register |                        |
        |----------------------->|                        |
        |                        | 2. Hash password       |
        |                        |    (bcrypt)            |
        |                        |----------------------->|
        |                        | 3. Store user          |
        |                        |<-----------------------|
        | 4. 201 Created         |                        |
        |<-----------------------|                        |
        |                        |                        |
        | 5. POST /auth/login    |                        |
        |----------------------->|                        |
        |                        | 6. Verify credentials  |
        |                        |----------------------->|
        |                        | 7. bcrypt.checkpw()    |
        |                        |<-----------------------|
        |                        | 8. Generate JWT        |
        | 9. Token + User        |                        |
        |<-----------------------|                        |
        |                        |                        |
        | 10. Request + Bearer   |                        |
        |----------------------->|                        |
        |                        | 11. Validate JWT       |
        |                        | 12. Check expiration   |
        |                        | 13. Load user context  |
        | 14. Protected Response |                        |
        |<-----------------------|                        |
```

---

## 3. Identificacion de Participantes

### 3.1 Identificador Unico Universal (UUID v4)

Cada participante recibe un identificador unico inmutable generado segun RFC 4122:

```python
user_id = str(uuid.uuid4())  # Ejemplo: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

**Caracteristicas:**
- 128 bits de entropia
- Probabilidad de colision: < 1 en 2^122
- No predecible ni secuencial
- Valido globalmente sin coordinacion central

### 3.2 Referencia de Contrato

Ademas del UUID, cada participante recibe una referencia de contrato legible:

```
Formato: FENITEL-AAAAMMDD-XXXXXXXX
Ejemplo: FENITEL-20260329-F47AC10B
```

### 3.3 Atributos de Identidad

| Atributo | Descripcion | Validacion |
|----------|-------------|------------|
| `id` | UUID v4 unico | Generado automaticamente |
| `email` | Correo electronico | Formato RFC 5322, unicidad |
| `nif` | NIF/CIF fiscal | Unicidad en el sistema |
| `organization` | Nombre de la organizacion | Requerido |
| `role` | Rol del participante | `promotor` \| `miembro` \| `proveedor` |

---

## 4. Sistema de Autenticacion

### 4.1 Algoritmo de Hash de Contrasenas: bcrypt

```python
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())
```

**Caracteristicas de seguridad:**
- Algoritmo adaptativo resistente a ataques de fuerza bruta
- Salt aleatorio de 128 bits por contrasena
- Factor de coste configurable (por defecto 12 rondas)
- Resistente a ataques con hardware especializado (GPU/ASIC)

### 4.2 Tokens JWT (JSON Web Tokens)

**Estandar:** RFC 7519

**Configuracion:**
```python
JWT_ALGORITHM = "HS256"           # HMAC-SHA256
JWT_EXPIRATION_HOURS = 24         # Expiracion en 24 horas
JWT_SECRET = os.environ['JWT_SECRET']  # Clave de 256 bits minimo
```

**Estructura del Token (payload):**
```json
{
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "usuario@empresa.es",
  "role": "miembro",
  "exp": 1711814400
}
```

**Flujo de autenticacion:**
1. Usuario envia credenciales (email + contrasena)
2. Sistema verifica contrasena contra hash bcrypt
3. Si valido, genera JWT firmado con HMAC-SHA256
4. Cliente almacena token y lo envia en header `Authorization: Bearer <token>`
5. Cada peticion: servidor valida firma y expiracion del JWT

### 4.3 Validacion de Token

```python
async def get_current_user(credentials: HTTPAuthorizationCredentials):
    try:
        payload = jwt.decode(
            credentials.credentials, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        user = await db.users.find_one({"id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")
```

---

## 5. Control de Acceso Basado en Roles (RBAC)

### 5.1 Roles Definidos

| Rol | Codigo | Permisos |
|-----|--------|----------|
| **Promotor** | `promotor` | Administracion completa, validacion de datasets, gestion de miembros, gobernanza |
| **Miembro** | `miembro` | Acceso al catalogo, perfil propio, consultas |
| **Proveedor** | `proveedor` | Miembro + subida de datasets, gestion de sus datos |

### 5.2 Middleware de Autorizacion

```python
async def require_promotor(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.PROMOTOR:
        raise HTTPException(status_code=403, detail="Acceso solo para promotor")
    return user
```

### 5.3 Matriz de Permisos por Endpoint

| Endpoint | Promotor | Miembro | Proveedor | Publico |
|----------|----------|---------|-----------|---------|
| `POST /auth/register` | - | - | - | SI |
| `POST /auth/login` | - | - | - | SI |
| `GET /members` | SI | NO | NO | NO |
| `GET /datasets/catalog` | SI | SI | SI | NO |
| `POST /datasets/upload` | SI | NO | SI | NO |
| `PUT /datasets/{id}/validate` | SI | NO | NO | NO |
| `GET /stats/public` | - | - | - | SI |
| `POST /incidents` | SI | SI | SI | NO |

---

## 6. Evidencias de Identidad con Firma Digital

### 6.1 Generacion de Certificados

Al registrarse, cada participante recibe automaticamente un **Certificado de Registro** en formato PDF que incluye:

- Identificador unico del participante
- Datos de la organizacion (nombre, CIF)
- Fecha y hora de registro (UTC)
- Referencia del contrato de adhesion
- Hash SHA-256 del documento

### 6.2 Firma Digital SHA-256

```python
import hashlib

def generate_certificate_hash(pdf_content: bytes) -> str:
    return hashlib.sha256(pdf_content).hexdigest()
```

**Ejemplo de hash:**
```
a3f2b8c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

### 6.3 Almacenamiento de Evidencias

```json
{
  "id": "uuid-evidencia",
  "user_id": "uuid-usuario",
  "evidence_type": "membership_registration",
  "hash": "sha256-hash",
  "timestamp": "2026-03-29T12:00:00Z",
  "pdf_path": "/storage/evidences/membership/membership_uuid.pdf",
  "metadata": {
    "member_id": "uuid-usuario",
    "organization_name": "Empresa S.L.",
    "cif": "B12345678",
    "contract_reference": "FENITEL-20260329-F47AC10B"
  },
  "generated_by": "system"
}
```

---

## 7. Logs de Auditoria

### 7.1 Registro Inmutable

Todas las acciones de autenticacion e identificacion se registran en la coleccion `audit_logs`:

```json
{
  "id": "uuid-log",
  "user_id": "uuid-usuario",
  "user_email": "usuario@empresa.es",
  "action": "LOGIN",
  "resource_type": "session",
  "resource_id": null,
  "ip_address": "192.168.1.100",
  "details": {},
  "timestamp": "2026-03-29T12:00:00Z"
}
```

### 7.2 Acciones Auditadas

| Accion | Descripcion |
|--------|-------------|
| `MEMBER_REGISTRATION` | Nuevo registro de participante |
| `LOGIN` | Inicio de sesion exitoso |
| `CERTIFICATE_GENERATION` | Generacion de certificado de identidad |
| `CONTRACT_SIGNED` | Firma del contrato de adhesion |
| `PAYMENT_CONFIRMED` | Confirmacion de pago |
| `DATASET_UPLOADED` | Subida de dataset |
| `DATASET_VALIDATED` | Validacion de dataset por promotor |

---

## 8. Roadmap: Credenciales Verificables (eIDAS 2.0)

### 8.1 Estado Actual vs. Objetivo

| Aspecto | Implementacion Actual | Objetivo eIDAS 2.0 |
|---------|----------------------|-------------------|
| Identificacion | UUID + NIF | DID (Decentralized Identifier) |
| Autenticacion | JWT + bcrypt | Verifiable Credentials (VC) |
| Firma | SHA-256 hash | PAdES (firma cualificada) |
| Wallet | No implementado | EUDI Wallet |

### 8.2 Plan de Migracion (P1)

1. **Fase 1:** Integracion con servicio de firma cualificada (certificados X.509)
2. **Fase 2:** Soporte para firma PAdES en evidencias PDF
3. **Fase 3:** Integracion con EUDI Wallet para credenciales verificables
4. **Fase 4:** Soporte DID (Decentralized Identifiers) segun W3C

---

## 9. Cumplimiento Normativo

### 9.1 UNE 0087:2025

| Criterio | Requisito | Estado |
|----------|-----------|--------|
| **Tec.2** | Mecanismos de autenticacion robustos | CUMPLE (JWT + bcrypt) |
| **Tec.4** | Trazabilidad de acciones | CUMPLE (Audit logs) |
| **Int.3** | Interoperabilidad de identidad | PARCIAL (preparado para eIDAS) |

### 9.2 Orden TDF/758/2025

| Requisito | Implementacion |
|-----------|----------------|
| Identificacion unica de participantes | UUID v4 + NIF validado |
| Registro de incorporacion | Certificado PDF firmado SHA-256 |
| Contrato de adhesion | Referencia unica FENITEL-YYYYMMDD-XXXX |
| Evidencia de identidad | PDF con hash verificable |

---

## 10. Endpoints de Autenticacion

### 10.1 Registro de Participante

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@empresa.es",
  "password": "ContrasenaSegura123!",
  "name": "Nombre Empresa S.L.",
  "organization": "Empresa S.L.",
  "nif": "B12345678",
  "phone": "+34 600 000 000",
  "address": "Calle Principal 1, 28001 Madrid",
  "role": "miembro"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "usuario@empresa.es",
  "name": "Nombre Empresa S.L.",
  "role": "miembro",
  "contract_reference": "FENITEL-20260329-F47AC10B",
  "registration_certificate_hash": "a3f2b8c9..."
}
```

### 10.2 Inicio de Sesion

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@empresa.es",
  "password": "ContrasenaSegura123!"
}
```

**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "email": "usuario@empresa.es",
    "role": "miembro"
  }
}
```

### 10.3 Obtener Usuario Actual

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 11. Resumen de Estandares Utilizados

| Estandar | Uso | Referencia |
|----------|-----|------------|
| **UUID v4** | Identificadores unicos | RFC 4122 |
| **JWT** | Tokens de sesion | RFC 7519 |
| **bcrypt** | Hash de contrasenas | OpenBSD bcrypt |
| **SHA-256** | Firma de evidencias | FIPS 180-4 |
| **HMAC-SHA256** | Firma de JWT | RFC 2104 |
| **ISO 8601** | Timestamps | ISO 8601:2019 |

---

**Documento generado automaticamente por el Espacio de Datos Sectorial FENITEL**  
**Cumple con los requisitos de identificacion y autenticacion de UNE 0087:2025**
