# FENITEL Espacio de Datos Sectorial - PRD

## Problem Statement
MVP funcional de Espacio de Datos Sectorial privado para FENITEL (Federación Nacional de Instaladores de Telecomunicaciones). Cumplimiento estricto de la Orden TDF/758/2025 (Kit Espacios de Datos).

## User Personas

### 1. Promotor (FENITEL)
- **Rol**: Administrador del espacio de datos
- **Permisos**: Gestión de registro, validación de datasets, emisión de evidencias, gobernanza, auditoría
- **Objetivos**: Mantener el cumplimiento normativo, gestionar miembros, validar datos

### 2. Miembro (Participante/Proveedor)
- **Rol**: Asociado de FENITEL
- **Permisos**: Acceso a su perfil, firma de contratos, subida de datasets (si es proveedor)
- **Objetivos**: Completar incorporación efectiva, compartir datos sectoriales

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
- ✅ Catálogo DCAT-AP simplificado
- ✅ Generador evidencias PDF firmadas
- ✅ Logs auditables completos
- ✅ Panel gobernanza configurable
- ✅ Exportación expediente ZIP por miembro

## What's Been Implemented

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

### P1 - Importante (Pendiente)
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

## Next Tasks
1. Implementar versionado del reglamento de gobernanza
2. Añadir sistema de imputación de horas (opcional según requisitos)
3. Preparar integración con certificado digital PAdES real
4. Configurar backup automático
5. Crear manual de despliegue
6. Crear checklist de cumplimiento Orden 758/2025
