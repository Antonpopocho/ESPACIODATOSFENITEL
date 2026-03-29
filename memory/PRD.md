# FENITEL Espacio de Datos Sectorial - PRD

## Problem Statement
MVP funcional de Espacio de Datos Sectorial privado para FENITEL (Federación Nacional de Instaladores de Telecomunicaciones). Cumplimiento estricto de la Orden TDF/758/2025 (Kit Espacios de Datos).

## User Personas

### 1. Promotor (FENITEL)
- **Rol**: Administrador del espacio de datos
- **Permisos**: Gestión de registro, validación de datasets, emisión de evidencias, gobernanza, auditoría, gestión de categorías
- **Objetivos**: Mantener el cumplimiento normativo, gestionar miembros, validar datos

### 2. Miembro (Participante/Proveedor)
- **Rol**: Asociado de FENITEL
- **Permisos**: Acceso a su perfil, firma de contratos, subida de datasets (si es proveedor), acceso al catálogo sectorial
- **Objetivos**: Completar incorporación efectiva, compartir datos sectoriales, consultar catálogo

## Core Requirements (Static)

### Flujo Obligatorio Orden 758/2025
1. ✅ Firma digital contrato adhesión
2. ✅ Registro formal miembro
3. ✅ Pago cuota incorporación (gestión manual)
4. ✅ Generación evidencia de identidad firmada digitalmente
5. ✅ (Proveedor) Subida dataset → Validación → Publicación → Evidencia publicación

### Módulos Implementados
- ✅ Registro miembros
- ✅ Gestión contratos (PDF + firma SHA-256)
- ✅ Control pagos (estado pagado/no pagado)
- ✅ Subida datasets (CSV/JSON)
- ✅ Catálogo DCAT-AP simplificado con categorías sectoriales
- ✅ Generador evidencias PDF firmadas
- ✅ Logs auditables completos
- ✅ Panel gobernanza configurable
- ✅ Exportación expediente ZIP por miembro
- ✅ Catálogo Global visible para todos los miembros

## What's Been Implemented

### Fecha: 29/03/2026 - Cumplimiento UNE 0087:2025

**Sistema de Incidencias y Reclamaciones (Gob.4)**
- Endpoint `POST/GET/PUT /api/incidents` - Gestión completa de incidencias
- Frontend `Incidents.js` con dashboard de estadísticas
- Tipos: incidencia, reclamación, consulta
- Prioridades: baja, media, alta, crítica
- Estados: abierta, en_proceso, resuelta, cerrada

**Procedimiento de Baja de Participantes (Gob.3)**
- Endpoint `POST /api/withdrawals` - Solicitud de baja
- Endpoint `PUT /api/withdrawals/{id}/approve|reject` - Gestión de bajas
- Workflow completo de solicitud → aprobación/rechazo

**Informes de Cumplimiento Automáticos (Tec.6)**
- Endpoint `GET /api/compliance/report` - Informe JSON en tiempo real
- Endpoint `GET /api/compliance/report/pdf` - Informe PDF descargable
- Frontend `Compliance.js` con dashboard de cumplimiento
- Verificación de las 5 dimensiones UNE 0087:2025

**Documentación Normativa**
- Informe de verificación `/app/docs/INFORME_VERIFICACION_UNE_0087.md`
- Landing page actualizada con UNE 0087:2025

### Fecha: 28/03/2026 - Landing Page y Documentación

**Landing Page Pública**
- Estadísticas en tiempo real (empresas y datasets)
- Beneficios de participación
- Conformidad normativa (UNE 0087:2025, Orden TDF/758/2025)
- Documentación descargable (Gobernanza, Contrato, Diseño)

### Fecha: 25/03/2026 - Catálogo Sectorial Global

**Catálogo de Datos Sectoriales**
- Endpoint `GET /api/datasets/catalog/full` - Todos los datasets publicados con info completa
- Endpoint `PUT /api/datasets/{id}/category` - Actualización de categoría (Promotor)
- Frontend `Catalog.js` con filtrado por categorías
- Categorías sectoriales: UTP, ICT, FM, SAT, General
- Colores distintivos por categoría
- Búsqueda en el catálogo
- Descarga de datasets desde el catálogo
- Diálogo de detalles del dataset
- Visibilidad global para miembros y promotores

**Tests Creados**
- `/app/tests/e2e/catalog.spec.ts` - 23 tests frontend
- `/app/backend/tests/test_catalog.py` - Tests de categorías y catálogo

### Fecha: 02/03/2026

**Backend (FastAPI + MongoDB)**
- Autenticación JWT con roles (promotor/miembro)
- CRUD completo de miembros
- Gestión de contratos con firma digital simple (SHA-256)
- Sistema de pagos con estado manual
- Subida y validación de datasets
- Catálogo DCAT-AP
- Generación de evidencias PDF
- Logs de auditoría inmutables
- Panel de gobernanza (comité + decisiones)
- Exportación de expedientes ZIP

**Frontend (React + Tailwind + Shadcn)**
- Login/Register con validación
- Dashboard Promotor con estadísticas
- Dashboard Miembro con estado de incorporación
- Gestión de miembros
- Gestión de pagos
- Subida y visualización de datasets
- Descarga de evidencias
- Panel de gobernanza
- Logs de auditoría

**Almacenamiento**
- `/app/storage/datasets/` - Datasets CSV/JSON
- `/app/storage/contracts/` - Contratos PDF firmados
- `/app/storage/evidence/` - Evidencias PDF
- `/app/storage/exports/` - Expedientes ZIP

## Prioritized Backlog

### P0 - Crítico (Completado)
- ✅ Autenticación y roles
- ✅ Flujo de incorporación efectiva
- ✅ Generación de evidencias
- ✅ Catálogo DCAT-AP
- ✅ Catálogo Sectorial Global con categorías (UTP, ICT, FM, SAT)
- ✅ Sistema de Incidencias y Reclamaciones (UNE 0087 Gob.4)
- ✅ Procedimiento de Baja de Participantes (UNE 0087 Gob.3)
- ✅ Informes de Cumplimiento Automáticos (UNE 0087 Tec.6)
- ✅ Landing Page con estadísticas públicas

### P1 - Importante (Pendiente)
- [ ] Documentación OpenAPI/Swagger (Int.4)
- [ ] Portal de transparencia con informes de actividad (Gob.5)
- [ ] Integración con certificado digital real (PAdES/eIDAS 2.0)
- [ ] Versionado de reglamento de gobernanza
- [ ] Backup automático programado

### P2 - Mejoras (Futuro)
- [ ] Notificaciones por email
- [ ] Dashboard con gráficos de evolución
- [ ] Integración con S3 real para almacenamiento
- [ ] API pública del catálogo DCAT-AP
- [ ] Multi-idioma

## Cumplimiento UNE 0087:2025

| Dimensión | Estado | Criterios |
|-----------|--------|-----------|
| Modelo de Negocio | ✅ CUMPLE | Neg.1, Neg.2, Neg.3 |
| Sistema de Gobernanza | ✅ CUMPLE | Gob.1, Gob.2, Gob.3, Gob.4, Gob.5 |
| Solución Técnica | ✅ CUMPLE | Tec.1, Tec.2, Tec.3, Tec.4, Tec.5, Tec.6 |
| Interoperabilidad | ✅ CUMPLE | Int.1, Int.2, Int.3, Int.4*, Int.5 |
| Verificación Funcional | ✅ CUMPLE | Fun.1, Fun.2, Fun.3, Fun.4 |

*Int.4: Documentación OpenAPI pendiente

## Credenciales de Demo

### Promotor (Admin)
- Email: admin@fenitel.es
- Password: FenitelAdmin2025!

### Miembro Demo
- Email: empresa@demo.com
- Password: Demo123456!

## Datasets Publicados (Catálogo)
- **UTP** - Comunicaciones por protocolo UTP (379.6 KB)
- **ICT** - Comunicaciones ICT (2.8 KB)  
- **FM** - Datos de comunicaciones por radio (0.5 KB)
- **SAT** - Datos de comunicaciones por Satélite (0.5 KB)
- **PRUEBADEMO** - Datos de prueba (11.4 KB) - Categoría: General

## Changelog

### Fecha: 29/03/2026 - Diagramas de Arquitectura
- Generador de diagramas PNG profesionales (`/app/scripts/generate_architecture_diagrams.py`)
- Endpoint `GET /api/diagrams` - Lista diagramas disponibles
- Endpoint `GET /api/diagrams/{filename}` - Descarga diagrama PNG
- 5 diagramas generados: Arquitectura Sistema, Flujo Incorporación, Modelo Datos, Cumplimiento UNE, Stack Tecnológico

## Next Tasks
1. Documentar API con OpenAPI/Swagger (Int.4)
2. Añadir sección de informes de actividad pública (Gob.5)
3. Preparar integración con certificado digital PAdES/eIDAS 2.0
4. Implementar versionado del reglamento de gobernanza
