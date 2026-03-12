# INFORME DE AUDITORÍA - FENITEL Espacio de Datos Sectorial
## Verificación de Cumplimiento Orden TDF/758/2025

**Fecha de Auditoría:** 12/03/2026
**Sistema:** FENITEL Espacio de Datos Sectorial
**Versión:** 1.0.0

---

## 1. RESUMEN EJECUTIVO

Se ha realizado una auditoría completa del sistema para verificar la implementación de los módulos de generación de evidencias conforme a la Orden TDF/758/2025. 

**Resultado:** ✅ SISTEMA CONFORME

---

## 2. MÓDULOS VERIFICADOS

### 2.1 Registro de Miembros ✅

**Tabla/Colección:** `users` (MongoDB)

**Campos implementados:**
| Campo | Tipo | Estado |
|-------|------|--------|
| id (member_id) | UUID | ✅ Implementado |
| name (organization_name) | String | ✅ Implementado |
| nif (cif) | String | ✅ Implementado |
| role | Enum | ✅ Implementado |
| created_at (date_joined) | DateTime | ✅ Implementado |
| contract_reference | String | ✅ Implementado |
| incorporation_status (status) | Enum | ✅ Implementado |
| registration_certificate_url | String | ✅ Implementado |
| registration_certificate_hash | String | ✅ Implementado |

---

### 2.2 API de Gestión de Miembros ✅

**Endpoints implementados:**

| Endpoint | Método | Estado | Descripción |
|----------|--------|--------|-------------|
| `/api/auth/register` | POST | ✅ | Registro de nuevo miembro |
| `/api/members` | GET | ✅ | Lista de miembros |
| `/api/members/{id}` | GET | ✅ | Detalle de miembro |
| `/api/members/extended` | GET | ✅ | Lista con datos de certificado |
| `/api/members/{id}/registration-certificate` | GET | ✅ | Descarga certificado registro |

**Flujo del endpoint de registro:**
1. ✅ Crea el miembro con ID único (UUID)
2. ✅ Registra timestamp (ISO 8601 UTC)
3. ✅ Genera automáticamente certificado de registro
4. ✅ Almacena evidencia en base de datos
5. ✅ Registra en log de auditoría

---

### 2.3 Generación Automática de Evidencia de Registro ✅

**Módulo:** `/app/backend/services/certificate_service.py`

**Función:** `generate_membership_certificate()`

**Contenido del certificado:**
- ✅ space_name: "Espacio de Datos Sectorial FENITEL"
- ✅ promoter: "FENITEL - Federación Nacional de Instaladores de Telecomunicaciones"
- ✅ organization_name
- ✅ cif/nif
- ✅ member_id
- ✅ role
- ✅ date_joined
- ✅ contract_reference
- ✅ issuer
- ✅ Firma digital (SHA-256)
- ✅ Timestamp de emisión

---

### 2.4 Almacenamiento de Evidencias ✅

**Estructura de directorios:**
```
/app/storage/
├── evidences/
│   ├── membership/          ← Certificados de registro
│   │   └── membership_*.pdf
│   └── datasets/            ← Certificados de publicación
│       └── dataset_publication_*.pdf
├── contracts/               ← Contratos firmados
├── evidence/                ← Evidencias legacy
├── datasets/                ← Archivos de datos
└── exports/                 ← Expedientes ZIP
```

**Campos en base de datos:**
- ✅ certificate_url (ruta al archivo)
- ✅ certificate_hash (SHA-256)

---

### 2.5 Evidencia de Publicación de Dataset ✅

**Endpoint:** `PUT /api/datasets/{id}/publish`

**Función:** `generate_dataset_publication_certificate()`

**Contenido del certificado:**
- ✅ dataset_id
- ✅ dataset_title
- ✅ provider (organization_name, cif, email)
- ✅ publication_date
- ✅ space_identifier
- ✅ metadata_reference (DCAT)
- ✅ dataset_description
- ✅ dataset_category
- ✅ dataset_license
- ✅ Firma digital (SHA-256)

**Endpoint de descarga:** `GET /api/datasets/{id}/publication-certificate`

---

### 2.6 Panel Administrativo ✅

**Sección ADMIN → MEMBERS:**
- ✅ [View member] - Ver detalles
- ✅ [Download registration evidence] - Descargar certificado registro
- ✅ [Export dossier] - Exportar expediente completo

**Sección ADMIN → DATASETS:**
- ✅ [View details] - Ver detalles
- ✅ [Download] - Descargar dataset
- ✅ [Download publication evidence] - Descargar certificado publicación
- ✅ [Validate] - Validar dataset
- ✅ [Publish] - Publicar dataset

---

### 2.7 Logs de Auditoría ✅

**Colección:** `audit_logs` (MongoDB)

**Eventos registrados:**
| Evento | Descripción |
|--------|-------------|
| MEMBER_REGISTRATION | Registro de nuevo miembro |
| DATASET_PUBLICATION | Publicación de dataset |
| CERTIFICATE_GENERATION | Generación de cualquier certificado |
| LOGIN | Inicio de sesión |
| SIGN_CONTRACT | Firma de contrato |
| VALIDATE_DATASET | Validación de dataset |

**Campos de cada registro:**
- ✅ event_type (action)
- ✅ entity_id (resource_id)
- ✅ timestamp
- ✅ actor (user_id, user_email)
- ✅ hash_reference (en details)
- ✅ ip_address

---

## 3. ENDPOINTS DISPONIBLES

### Autenticación
```
POST /api/auth/register    - Registro con generación automática de certificado
POST /api/auth/login       - Inicio de sesión
GET  /api/auth/me          - Datos del usuario actual
```

### Miembros
```
GET  /api/members                              - Lista de miembros
GET  /api/members/extended                     - Lista con datos de certificados
GET  /api/members/{id}                         - Detalle de miembro
GET  /api/members/{id}/registration-certificate - Descarga certificado registro
PUT  /api/members/{id}/provider                - Toggle estado proveedor
```

### Datasets
```
GET  /api/datasets                            - Lista de datasets
POST /api/datasets                            - Subida de dataset
GET  /api/datasets/catalog                    - Catálogo DCAT-AP
PUT  /api/datasets/{id}/validate              - Validación técnica
PUT  /api/datasets/{id}/publish               - Publicación con certificado
GET  /api/datasets/{id}/download              - Descarga dataset
GET  /api/datasets/{id}/publication-certificate - Descarga certificado publicación
```

### Evidencias
```
GET /api/evidence/{id}/pdf                    - Descarga evidencia PDF
GET /api/evidence/user/{user_id}              - Evidencias de un usuario
```

### Auditoría
```
GET /api/audit                                - Lista de logs
GET /api/audit/export                         - Exportación CSV
```

---

## 4. UBICACIÓN DE EVIDENCIAS

```
/app/storage/evidences/
├── membership/
│   └── membership_{member_id}.pdf      ← Certificados de registro
└── datasets/
    └── dataset_publication_{id}.pdf    ← Certificados de publicación
```

---

## 5. EJEMPLOS DE CERTIFICADOS GENERADOS

### 5.1 Certificado de Registro de Miembro

**Archivo:** `membership_24370f2e-eb84-4e54-8df2-ff63a881069e.pdf`

**Contenido:**
- Título: CERTIFICADO DE REGISTRO DE MIEMBRO
- Espacio: Espacio de Datos Sectorial FENITEL
- Identificador: FENITEL-EDS-2025
- Promotor: FENITEL
- Miembro: Nueva Empresa Test S.L.
- CIF: B11223344
- Fecha: 12/03/2026
- Hash SHA-256: b93a2dfbb1660903092a6335b1e34d053bfa8d0e...

### 5.2 Certificado de Publicación de Dataset

**Archivo:** `dataset_publication_6d0cfd36-b53a-46a9-a658-06afcecc5c07.pdf`

**Contenido:**
- Título: CERTIFICADO DE PUBLICACIÓN DE DATASET
- Dataset: PRUEBADEMO
- Proveedor: Empresa Demo S.L.
- Fecha publicación: 04/03/2026
- Referencia DCAT: DCAT-FENITEL-EDS-2025-4F704955
- Hash SHA-256: (firmado digitalmente)

---

## 6. FLUJO DE GENERACIÓN DE EVIDENCIAS

### Registro de Miembro:
```
register_member()
    → assign member_id (UUID)
    → generate contract_reference
    → generate_membership_certificate()
    → store evidence in /storage/evidences/membership/
    → update database with certificate_url, certificate_hash
    → log audit event (MEMBER_REGISTRATION, CERTIFICATE_GENERATION)
```

### Publicación de Dataset:
```
publish_dataset()
    → validate dataset is valid
    → generate_dataset_publication_certificate()
    → store evidence in /storage/evidences/datasets/
    → update dataset with publication_certificate_url, hash
    → store evidence record in database
    → log audit event (DATASET_PUBLICATION, CERTIFICATE_GENERATION)
```

---

## 7. CONCLUSIÓN

El sistema FENITEL Espacio de Datos Sectorial cumple con todos los requisitos especificados para la generación de evidencias formales:

| Requisito | Estado |
|-----------|--------|
| Registro formal de miembros | ✅ Implementado |
| Generación automática de certificado de registro | ✅ Implementado |
| Publicación de datasets con evidencia | ✅ Implementado |
| Almacenamiento estructurado de evidencias | ✅ Implementado |
| Trazabilidad mediante logs de auditoría | ✅ Implementado |
| Descarga de evidencias desde panel admin | ✅ Implementado |
| Firma digital (SHA-256) | ✅ Implementado |

**El sistema está preparado para demostrar:**
- Registro formal de miembros
- Publicación de datasets
- Trazabilidad de incorporación al espacio de datos

---

*Informe generado automáticamente por el sistema de auditoría FENITEL*
