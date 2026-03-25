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

### P1 - Importante (Pendiente)
- [ ] Verificar Panel de Gobernanza completo
- [ ] Versionado de reglamento de gobernanza
- [ ] Sistema de imputación de horas (opcional)
- [ ] Integración con certificado digital real (PAdES)
- [ ] Backup automático programado

### P2 - Mejoras (Futuro)
- [ ] Notificaciones por email
- [ ] Dashboard con gráficos de evolución
- [ ] Integración con S3 real para almacenamiento
- [ ] API pública del catálogo DCAT-AP
- [ ] Multi-idioma

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

## Next Tasks
1. Verificar Panel de Gobernanza (configuración comité, logging decisiones, actas)
2. Testing de regresión completo
3. Implementar versionado del reglamento de gobernanza
4. Preparar integración con certificado digital PAdES real
