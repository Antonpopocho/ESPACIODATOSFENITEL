# DIAGRAMA DE FLUJO DE GENERACIÓN DE EVIDENCIAS
## FENITEL Espacio de Datos Sectorial - Orden TDF/758/2025

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE REGISTRO DE MIEMBRO                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   USUARIO       │
                              │   (Solicitante) │
                              └────────┬────────┘
                                       │
                                       ▼
                         ┌─────────────────────────┐
                         │  POST /api/auth/register │
                         │  (Formulario registro)   │
                         └────────────┬────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │ Validar NIF  │  │ Generar UUID │  │  Timestamp   │
           │ único        │  │ (member_id)  │  │  UTC         │
           └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Generar contract_reference   │
                    │  FENITEL-YYYYMMDD-{ID}       │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │           CERTIFICATE SERVICE                          │
        │  generate_membership_certificate()                     │
        │                                                        │
        │  ┌─────────────────────────────────────────────────┐  │
        │  │  Contenido del PDF:                              │  │
        │  │  • space_name: FENITEL EDS                       │  │
        │  │  • promoter: FENITEL                             │  │
        │  │  • member_id                                     │  │
        │  │  • organization_name                             │  │
        │  │  • cif                                           │  │
        │  │  • role                                          │  │
        │  │  • date_joined                                   │  │
        │  │  • contract_reference                            │  │
        │  │  • issuer                                        │  │
        │  └─────────────────────────────────────────────────┘  │
        │                         │                              │
        │                         ▼                              │
        │  ┌─────────────────────────────────────────────────┐  │
        │  │  FIRMA DIGITAL                                   │  │
        │  │  hash = SHA-256(datos + timestamp)              │  │
        │  └─────────────────────────────────────────────────┘  │
        └───────────────────────────┬───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │  ALMACENAMIENTO           │   │  BASE DE DATOS            │
    │  /storage/evidences/      │   │  MongoDB                  │
    │  membership/              │   │                           │
    │  membership_{id}.pdf      │   │  users.certificate_url    │
    │                           │   │  users.certificate_hash   │
    │                           │   │  evidence (registro)      │
    └───────────────────────────┘   └───────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  LOG DE AUDITORÍA             │
                    │  • MEMBER_REGISTRATION        │
                    │  • CERTIFICATE_GENERATION     │
                    │  + timestamp, user, IP, hash  │
                    └───────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE PUBLICACIÓN DE DATASET                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   PROMOTOR      │
                              │   (Admin)       │
                              └────────┬────────┘
                                       │
                                       ▼
                    ┌───────────────────────────────┐
                    │  PUT /api/datasets/{id}/publish│
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Verificar validation_status  │
                    │  == "valid"                   │
                    └───────────────┬───────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                    ┌─────┴─────┐       ┌─────┴─────┐
                    │  VÁLIDO   │       │ INVÁLIDO  │
                    └─────┬─────┘       └─────┬─────┘
                          │                   │
                          ▼                   ▼
                    (continúa)          (error 400)
                          │
                          ▼
        ┌───────────────────────────────────────────────────────┐
        │           CERTIFICATE SERVICE                          │
        │  generate_dataset_publication_certificate()            │
        │                                                        │
        │  ┌─────────────────────────────────────────────────┐  │
        │  │  Contenido del PDF:                              │  │
        │  │  • space_identifier: FENITEL-EDS-2025           │  │
        │  │  • dataset_id                                    │  │
        │  │  • dataset_title                                 │  │
        │  │  • provider_name                                 │  │
        │  │  • provider_cif                                  │  │
        │  │  • publication_date                              │  │
        │  │  • metadata_reference (DCAT)                     │  │
        │  │  • dataset_description                           │  │
        │  │  • dataset_category                              │  │
        │  │  • dataset_license                               │  │
        │  └─────────────────────────────────────────────────┘  │
        │                         │                              │
        │                         ▼                              │
        │  ┌─────────────────────────────────────────────────┐  │
        │  │  FIRMA DIGITAL                                   │  │
        │  │  hash = SHA-256(datos + timestamp)              │  │
        │  └─────────────────────────────────────────────────┘  │
        └───────────────────────────┬───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │  ALMACENAMIENTO           │   │  BASE DE DATOS            │
    │  /storage/evidences/      │   │  MongoDB                  │
    │  datasets/                │   │                           │
    │  dataset_publication_     │   │  datasets.status=published│
    │  {id}.pdf                 │   │  datasets.publication_    │
    │                           │   │    certificate_url        │
    │                           │   │  datasets.publication_    │
    │                           │   │    certificate_hash       │
    │                           │   │  evidence (registro)      │
    └───────────────────────────┘   └───────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  LOG DE AUDITORÍA             │
                    │  • DATASET_PUBLICATION        │
                    │  • CERTIFICATE_GENERATION     │
                    │  + timestamp, user, IP, hash  │
                    └───────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA DE ALMACENAMIENTO                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

    /app/storage/
    │
    ├── evidences/
    │   │
    │   ├── membership/                    ← CERTIFICADOS DE REGISTRO
    │   │   ├── membership_{uuid1}.pdf
    │   │   ├── membership_{uuid2}.pdf
    │   │   └── ...
    │   │
    │   └── datasets/                      ← CERTIFICADOS DE PUBLICACIÓN
    │       ├── dataset_publication_{uuid1}.pdf
    │       ├── dataset_publication_{uuid2}.pdf
    │       └── ...
    │
    ├── contracts/                         ← CONTRATOS FIRMADOS
    │   ├── {contract_id}.pdf
    │   └── ...
    │
    ├── evidence/                          ← EVIDENCIAS DE IDENTIDAD
    │   ├── {evidence_id}.pdf
    │   └── ...
    │
    ├── datasets/                          ← ARCHIVOS DE DATOS
    │   ├── {dataset_id}.csv
    │   ├── {dataset_id}.json
    │   └── ...
    │
    └── exports/                           ← EXPEDIENTES ZIP
        └── expediente_{member_id}_{date}.zip


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CAMPOS DE AUDITORÍA                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

    audit_logs {
        id:            UUID              // Identificador único del log
        user_id:       UUID              // ID del usuario que realizó la acción
        user_email:    String            // Email del usuario
        action:        String            // Tipo de evento:
                                         //   - MEMBER_REGISTRATION
                                         //   - DATASET_PUBLICATION
                                         //   - CERTIFICATE_GENERATION
                                         //   - LOGIN
                                         //   - SIGN_CONTRACT
                                         //   - VALIDATE_DATASET
        resource_type: String            // Tipo de recurso: member, dataset, evidence
        resource_id:   UUID              // ID del recurso afectado
        ip_address:    String            // Dirección IP del cliente
        timestamp:     DateTime (UTC)    // Fecha y hora ISO 8601
        details: {                       // Información adicional
            certificate_hash: String     // Hash del certificado generado
            contract_reference: String   // Referencia del contrato
            ...
        }
    }


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO DE INCORPORACIÓN                              │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ REGISTRO │ ──▶ │ CONTRATO │ ──▶ │  PAGO    │ ──▶ │IDENTIDAD │ ──▶ │ EFECTIVO │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
         │                │                │                │                │
         ▼                ▼                ▼                ▼                ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │CERT. REG │     │CONTRATO  │     │ ESTADO   │     │CERT. ID  │     │ ACCESO   │
    │  (auto)  │     │  PDF     │     │  PAGO    │     │  (admin) │     │ COMPLETO │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘

    Si es PROVEEDOR:
                                                                              │
                                                                              ▼
                                                                    ┌──────────────┐
                                                                    │ SUBIR DATASET│
                                                                    └──────┬───────┘
                                                                           │
                                                                           ▼
                                                                    ┌──────────────┐
                                                                    │  VALIDACIÓN  │
                                                                    └──────┬───────┘
                                                                           │
                                                                           ▼
                                                                    ┌──────────────┐
                                                                    │ PUBLICACIÓN  │
                                                                    │  + CERT.     │
                                                                    └──────────────┘
```

---

## LEYENDA

| Símbolo | Significado |
|---------|-------------|
| ──▶ | Flujo de proceso |
| ┌───┐ | Proceso/Acción |
| │   │ | |
| └───┘ | |
| (auto) | Generación automática |
| (admin) | Requiere acción del promotor |

---

*Diagrama generado para FENITEL Espacio de Datos Sectorial*
*Orden TDF/758/2025 - Kit Espacios de Datos*
