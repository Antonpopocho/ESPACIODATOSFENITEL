# Checklist Cumplimiento Orden TDF/758/2025

## FENITEL - Espacio de Datos Sectorial

---

## 1. REGISTRO Y ADHESIÓN

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Formulario de registro de miembros | Implementado | `/register` |
| ✅ Validación de NIF/CIF | Implementado | Unicidad en BD |
| ✅ Generación de contrato de adhesión | Implementado | PDF generado |
| ✅ Firma digital del contrato | Implementado | SHA-256 + timestamp |
| ✅ Almacenamiento seguro del contrato firmado | Implementado | `/storage/contracts/` |

## 2. CUOTAS E INCORPORACIÓN

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Registro de pago de cuota | Implementado | Estado en BD |
| ✅ Control de estado de pago | Implementado | Panel de pagos |
| ✅ Bloqueo de funciones hasta pago confirmado | Implementado | Validación en backend |
| ✅ Estado "Incorporación Efectiva" | Implementado | Flujo completo |

## 3. EVIDENCIAS DIGITALES

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Evidencia de identidad firmada | Implementado | PDF con hash SHA-256 |
| ✅ Evidencia de publicación de dataset | Implementado | PDF con hash SHA-256 |
| ✅ Timestamp en todas las evidencias | Implementado | ISO 8601 UTC |
| ✅ Descarga de evidencias | Implementado | Endpoint `/evidence/{id}/pdf` |

## 4. CATÁLOGO DE DATOS (DCAT-AP)

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Metadatos DCAT-AP para datasets | Implementado | JSON-LD structure |
| ✅ Endpoint de catálogo público | Implementado | `/api/datasets/catalog` |
| ✅ Identificador único por dataset | Implementado | UUID |
| ✅ Versionado de datasets | Implementado | Campo `version` |
| ✅ Licencias configurables | Implementado | CC-BY-4.0, etc. |

## 5. VALIDACIÓN TÉCNICA

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Validación de formato (CSV/JSON) | Implementado | Parser en backend |
| ✅ Estado de validación visible | Implementado | `validation_status` |
| ✅ Publicación solo tras validación | Implementado | Control en endpoint |

## 6. GOBERNANZA

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Configuración de comité | Implementado | Panel de gobernanza |
| ✅ Registro de decisiones | Implementado | CRUD de decisiones |
| ✅ Tipos de decisión (acuerdo, acta, resolución) | Implementado | Select en formulario |
| ⏳ Versionado de reglamento | Pendiente | P1 |
| ⏳ Publicación de actas | Parcial | Registro existente |

## 7. AUDITORÍA Y TRAZABILIDAD

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Logs inmutables | Implementado | Colección `audit_logs` |
| ✅ Registro de usuario | Implementado | `user_id`, `user_email` |
| ✅ Registro de fecha/hora | Implementado | `timestamp` ISO 8601 |
| ✅ Registro de IP | Implementado | `ip_address` |
| ✅ Registro de acción | Implementado | `action` |
| ✅ Exportación de logs | Implementado | CSV descargable |

## 8. EXPEDIENTE POR MIEMBRO

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Exportación completa ZIP | Implementado | `/export/member/{id}` |
| ✅ Incluye datos personales | Implementado | JSON |
| ✅ Incluye contratos | Implementado | PDF |
| ✅ Incluye evidencias | Implementado | PDFs |
| ✅ Incluye datasets | Implementado | CSV/JSON |
| ✅ Incluye logs de auditoría | Implementado | JSON |

## 9. SEGURIDAD

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ HTTPS | Configurado | Via Kubernetes Ingress |
| ✅ Autenticación JWT | Implementado | Token 24h |
| ✅ Control de acceso por roles | Implementado | promotor/miembro |
| ✅ Hash de contraseñas | Implementado | bcrypt |
| ⏳ Backup automático | Pendiente | P1 |

## 10. ARQUITECTURA

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| ✅ Backend Python FastAPI | Implementado | `/backend/server.py` |
| ✅ Base de datos MongoDB | Implementado | Motor async |
| ✅ Frontend React | Implementado | `/frontend/src/` |
| ✅ Almacenamiento local compatible S3 | Implementado | `/storage/` |
| ✅ Desplegable en contenedores | Implementado | Docker-ready |

---

## RESUMEN

| Categoría | Completado | Pendiente | % |
|-----------|------------|-----------|---|
| Registro y Adhesión | 5/5 | 0 | 100% |
| Cuotas e Incorporación | 4/4 | 0 | 100% |
| Evidencias | 4/4 | 0 | 100% |
| Catálogo DCAT-AP | 5/5 | 0 | 100% |
| Validación Técnica | 3/3 | 0 | 100% |
| Gobernanza | 3/5 | 2 | 60% |
| Auditoría | 6/6 | 0 | 100% |
| Expediente | 6/6 | 0 | 100% |
| Seguridad | 4/5 | 1 | 80% |
| Arquitectura | 5/5 | 0 | 100% |

**TOTAL: 45/48 requisitos implementados (94%)**

---

## FIRMA

Fecha de verificación: __/__/____

Responsable: _________________________

Firma: _________________________
