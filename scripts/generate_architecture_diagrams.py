#!/usr/bin/env python3
"""
Generador de Diagramas de Arquitectura - Espacio de Datos FENITEL
Genera imágenes PNG profesionales para documentación
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle
import os

# Crear directorio de salida
OUTPUT_DIR = "/app/storage/diagrams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Colores corporativos
COLORS = {
    'primary': '#1e40af',      # Azul FENITEL
    'secondary': '#3b82f6',    # Azul claro
    'accent': '#10b981',       # Verde éxito
    'warning': '#f59e0b',      # Amarillo
    'danger': '#ef4444',       # Rojo
    'light': '#f3f4f6',        # Gris claro
    'dark': '#1f2937',         # Gris oscuro
    'white': '#ffffff',
    'mongo': '#47A248',        # MongoDB verde
    'react': '#61DAFB',        # React azul
    'fastapi': '#009688',      # FastAPI verde
}

def create_rounded_box(ax, x, y, width, height, text, color, text_color='white', fontsize=10, alpha=1.0):
    """Crear caja redondeada con texto"""
    box = FancyBboxPatch(
        (x, y), width, height,
        boxstyle="round,pad=0.02,rounding_size=0.02",
        facecolor=color,
        edgecolor='#374151',
        linewidth=1.5,
        alpha=alpha
    )
    ax.add_patch(box)
    ax.text(x + width/2, y + height/2, text,
            ha='center', va='center',
            fontsize=fontsize, fontweight='bold',
            color=text_color, wrap=True)
    return box

def draw_arrow(ax, start, end, color='#374151', style='->'):
    """Dibujar flecha entre dos puntos"""
    ax.annotate('', xy=end, xytext=start,
                arrowprops=dict(arrowstyle=style, color=color, lw=2))

# ============================================================
# DIAGRAMA 1: Arquitectura General del Sistema
# ============================================================
def generate_system_architecture():
    fig, ax = plt.subplots(1, 1, figsize=(16, 12))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Título
    ax.text(8, 11.5, 'ARQUITECTURA DEL SISTEMA - ESPACIO DE DATOS FENITEL',
            ha='center', va='center', fontsize=16, fontweight='bold', color=COLORS['dark'])
    ax.text(8, 11.0, 'Cumplimiento UNE 0087:2025 y Orden TDF/758/2025',
            ha='center', va='center', fontsize=11, style='italic', color=COLORS['secondary'])
    
    # === CAPA DE USUARIOS (arriba) ===
    ax.text(8, 10.2, 'CAPA DE USUARIOS', ha='center', fontsize=12, fontweight='bold', color=COLORS['dark'])
    
    # Promotor
    create_rounded_box(ax, 2, 9, 2.5, 0.8, 'PROMOTOR\n(FENITEL)', COLORS['primary'], fontsize=9)
    ax.text(3.25, 8.7, 'Administración', ha='center', fontsize=8, color='gray')
    
    # Miembros
    create_rounded_box(ax, 6.75, 9, 2.5, 0.8, 'MIEMBROS\n(Empresas)', COLORS['secondary'], fontsize=9)
    ax.text(8, 8.7, 'Participantes', ha='center', fontsize=8, color='gray')
    
    # Público
    create_rounded_box(ax, 11.5, 9, 2.5, 0.8, 'PÚBLICO\n(Visitantes)', COLORS['accent'], fontsize=9)
    ax.text(12.75, 8.7, 'Landing Page', ha='center', fontsize=8, color='gray')
    
    # === CAPA DE PRESENTACIÓN ===
    ax.add_patch(FancyBboxPatch((1, 6.5), 14, 2, boxstyle="round,pad=0.02", 
                                 facecolor=COLORS['light'], edgecolor=COLORS['react'], linewidth=2, alpha=0.5))
    ax.text(8, 8.2, 'CAPA DE PRESENTACION (Frontend React + Tailwind)', 
            ha='center', fontsize=11, fontweight='bold', color=COLORS['dark'])
    
    # Componentes Frontend
    create_rounded_box(ax, 1.5, 6.8, 2, 0.8, 'Dashboard\nPromotor', COLORS['react'], COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 4, 6.8, 2, 0.8, 'Dashboard\nMiembro', COLORS['react'], COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 6.5, 6.8, 2, 0.8, 'Catálogo\nGlobal', COLORS['react'], COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 9, 6.8, 2, 0.8, 'Gestión\nDatasets', COLORS['react'], COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 11.5, 6.8, 2, 0.8, 'Landing\nPage', COLORS['react'], COLORS['dark'], fontsize=8)
    
    # === CAPA DE API ===
    ax.add_patch(FancyBboxPatch((1, 4), 14, 2, boxstyle="round,pad=0.02", 
                                 facecolor='#e8f5e9', edgecolor=COLORS['fastapi'], linewidth=2, alpha=0.5))
    ax.text(8, 5.7, 'CAPA DE API (FastAPI + JWT)', 
            ha='center', fontsize=11, fontweight='bold', color=COLORS['dark'])
    
    # Endpoints
    create_rounded_box(ax, 1.5, 4.3, 1.8, 0.8, '/auth\nJWT', COLORS['fastapi'], fontsize=8)
    create_rounded_box(ax, 3.6, 4.3, 1.8, 0.8, '/members\nCRUD', COLORS['fastapi'], fontsize=8)
    create_rounded_box(ax, 5.7, 4.3, 1.8, 0.8, '/datasets\nUpload', COLORS['fastapi'], fontsize=8)
    create_rounded_box(ax, 7.8, 4.3, 1.8, 0.8, '/evidence\nPDF', COLORS['fastapi'], fontsize=8)
    create_rounded_box(ax, 9.9, 4.3, 1.8, 0.8, '/incidents\nTickets', COLORS['fastapi'], fontsize=8)
    create_rounded_box(ax, 12, 4.3, 1.8, 0.8, '/compliance\nReports', COLORS['fastapi'], fontsize=8)
    
    # === CAPA DE SERVICIOS ===
    ax.add_patch(FancyBboxPatch((1, 1.8), 14, 1.8, boxstyle="round,pad=0.02", 
                                 facecolor='#fff3e0', edgecolor=COLORS['warning'], linewidth=2, alpha=0.5))
    ax.text(8, 3.3, 'CAPA DE SERVICIOS', 
            ha='center', fontsize=11, fontweight='bold', color=COLORS['dark'])
    
    create_rounded_box(ax, 1.5, 2.1, 2.2, 0.8, 'Validación\nCSV/JSON', COLORS['warning'], COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 4.2, 2.1, 2.2, 0.8, 'Generador\nPDF (ReportLab)', COLORS['warning'], COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 6.9, 2.1, 2.2, 0.8, 'Firma Digital\nSHA-256', COLORS['warning'], COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 9.6, 2.1, 2.2, 0.8, 'Logs\nAuditoría', COLORS['warning'], COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 12.3, 2.1, 2.2, 0.8, 'Export\nZIP', COLORS['warning'], COLORS['dark'], fontsize=8)
    
    # === CAPA DE DATOS ===
    ax.add_patch(FancyBboxPatch((1, 0.2), 14, 1.3, boxstyle="round,pad=0.02", 
                                 facecolor='#e8f5e9', edgecolor=COLORS['mongo'], linewidth=2, alpha=0.5))
    ax.text(8, 1.2, 'CAPA DE PERSISTENCIA', 
            ha='center', fontsize=11, fontweight='bold', color=COLORS['dark'])
    
    create_rounded_box(ax, 2, 0.4, 2.5, 0.6, 'MongoDB\n(Colecciones)', COLORS['mongo'], fontsize=8)
    create_rounded_box(ax, 5.5, 0.4, 2.5, 0.6, '/storage/datasets\n(Archivos)', COLORS['mongo'], fontsize=8)
    create_rounded_box(ax, 9, 0.4, 2.5, 0.6, '/storage/evidence\n(PDFs)', COLORS['mongo'], fontsize=8)
    create_rounded_box(ax, 12.5, 0.4, 2, 0.6, '/storage/exports', COLORS['mongo'], fontsize=8)
    
    # Flechas de conexión
    draw_arrow(ax, (3.25, 9), (3.25, 8.5))
    draw_arrow(ax, (8, 9), (8, 8.5))
    draw_arrow(ax, (12.75, 9), (12.75, 8.5))
    
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/01_arquitectura_sistema.png", dpi=150, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print(f"✅ Generado: {OUTPUT_DIR}/01_arquitectura_sistema.png")


# ============================================================
# DIAGRAMA 2: Flujo de Incorporación Efectiva
# ============================================================
def generate_incorporation_flow():
    fig, ax = plt.subplots(1, 1, figsize=(18, 10))
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Título
    ax.text(9, 9.5, 'FLUJO DE INCORPORACIÓN EFECTIVA DE MIEMBROS',
            ha='center', va='center', fontsize=16, fontweight='bold', color=COLORS['dark'])
    ax.text(9, 9.0, 'Conforme a Orden TDF/758/2025 - Kit Espacios de Datos',
            ha='center', va='center', fontsize=11, style='italic', color=COLORS['secondary'])
    
    # Fases
    y_start = 7.5
    box_h = 1.2
    box_w = 2.8
    
    # FASE 1: Registro
    create_rounded_box(ax, 0.5, y_start, box_w, box_h, '1. REGISTRO\n\nSolicitud de alta\nEmail + Organizacion', 
                      COLORS['secondary'], fontsize=9)
    ax.text(1.9, y_start - 0.4, 'POST /api/auth/register', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    # Flecha
    ax.annotate('', xy=(3.8, y_start + box_h/2), xytext=(3.4, y_start + box_h/2),
                arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=2))
    
    # FASE 2: Contrato
    create_rounded_box(ax, 4, y_start, box_w, box_h, '2. CONTRATO\n\nFirma digital\nContrato adhesion', 
                      COLORS['primary'], fontsize=9)
    ax.text(5.4, y_start - 0.4, 'POST /api/contract/sign', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    # Flecha
    ax.annotate('', xy=(7.3, y_start + box_h/2), xytext=(6.9, y_start + box_h/2),
                arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=2))
    
    # FASE 3: Pago
    create_rounded_box(ax, 7.5, y_start, box_w, box_h, '3. PAGO\n\nCuota incorporacion\n(Gestion manual)', 
                      COLORS['warning'], COLORS['dark'], fontsize=9)
    ax.text(8.9, y_start - 0.4, 'PUT /api/members/{id}/payment', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    # Flecha
    ax.annotate('', xy=(10.8, y_start + box_h/2), xytext=(10.4, y_start + box_h/2),
                arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=2))
    
    # FASE 4: Evidencia
    create_rounded_box(ax, 11, y_start, box_w, box_h, '4. EVIDENCIA\n\nGeneracion PDF\nIdentidad firmada', 
                      COLORS['accent'], fontsize=9)
    ax.text(12.4, y_start - 0.4, 'Auto-generada', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    # Flecha
    ax.annotate('', xy=(14.3, y_start + box_h/2), xytext=(13.9, y_start + box_h/2),
                arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=2))
    
    # FASE 5: Activo
    create_rounded_box(ax, 14.5, y_start, box_w, box_h, '5. ACTIVO\n\nMiembro\nIncorporado', 
                      '#16a34a', fontsize=9)
    ax.text(15.9, y_start - 0.4, 'status: "activo"', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    # === SECCIÓN PROVEEDORES (si aplica) ===
    y_prov = 4.5
    
    ax.text(9, y_prov + 1.8, 'FLUJO ADICIONAL PARA PROVEEDORES DE DATOS', 
            ha='center', fontsize=12, fontweight='bold', color=COLORS['dark'])
    
    # Subida Dataset
    create_rounded_box(ax, 2, y_prov, box_w, box_h, '6. SUBIDA\n\nDataset CSV/JSON\nCategoria sectorial', 
                      COLORS['secondary'], fontsize=9)
    ax.text(3.4, y_prov - 0.4, 'POST /api/datasets/upload', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    ax.annotate('', xy=(5.3, y_prov + box_h/2), xytext=(4.9, y_prov + box_h/2),
                arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=2))
    
    # Validación
    create_rounded_box(ax, 5.5, y_prov, box_w, box_h, '7. VALIDACION\n\nFormato + Contenido\nPromotor revisa', 
                      COLORS['warning'], COLORS['dark'], fontsize=9)
    ax.text(6.9, y_prov - 0.4, 'PUT /api/datasets/{id}/validate', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    ax.annotate('', xy=(8.8, y_prov + box_h/2), xytext=(8.4, y_prov + box_h/2),
                arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=2))
    
    # Publicación
    create_rounded_box(ax, 9, y_prov, box_w, box_h, '8. PUBLICACION\n\nCatalogo Global\nDCAT-AP', 
                      COLORS['primary'], fontsize=9)
    ax.text(10.4, y_prov - 0.4, 'PUT /api/datasets/{id}/publish', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    ax.annotate('', xy=(12.3, y_prov + box_h/2), xytext=(11.9, y_prov + box_h/2),
                arrowprops=dict(arrowstyle='->', color=COLORS['dark'], lw=2))
    
    # Evidencia Dataset
    create_rounded_box(ax, 12.5, y_prov, box_w, box_h, '9. EVIDENCIA\n\nCertificado PDF\nPublicacion firmada', 
                      COLORS['accent'], fontsize=9)
    ax.text(13.9, y_prov - 0.4, 'Auto-generada', ha='center', fontsize=7, 
            family='monospace', color='gray')
    
    # === LEYENDA ===
    ax.text(9, 2.5, 'CATEGORIAS SECTORIALES', ha='center', fontsize=11, fontweight='bold', color=COLORS['dark'])
    
    create_rounded_box(ax, 2, 1.5, 2.5, 0.7, 'UTP\nComun', '#3b82f6', fontsize=8)
    create_rounded_box(ax, 5, 1.5, 2.5, 0.7, 'ICT\nInfraestructuras', '#10b981', fontsize=8)
    create_rounded_box(ax, 8, 1.5, 2.5, 0.7, 'FM\nRadiofrecuencia', '#f59e0b', COLORS['dark'], fontsize=8)
    create_rounded_box(ax, 11, 1.5, 2.5, 0.7, 'SAT\nSatélite', '#8b5cf6', fontsize=8)
    create_rounded_box(ax, 14, 1.5, 2.5, 0.7, 'General\nOtros', '#6b7280', fontsize=8)
    
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/02_flujo_incorporacion.png", dpi=150, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print(f"✅ Generado: {OUTPUT_DIR}/02_flujo_incorporacion.png")


# ============================================================
# DIAGRAMA 3: Modelo de Datos
# ============================================================
def generate_data_model():
    fig, ax = plt.subplots(1, 1, figsize=(16, 12))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Título
    ax.text(8, 11.5, 'MODELO DE DATOS - MONGODB',
            ha='center', va='center', fontsize=16, fontweight='bold', color=COLORS['dark'])
    ax.text(8, 11.0, 'Colecciones principales del Espacio de Datos',
            ha='center', va='center', fontsize=11, style='italic', color=COLORS['secondary'])
    
    # Función para dibujar entidad
    def draw_entity(x, y, title, fields, color):
        h = 0.35 * (len(fields) + 1)
        w = 3.5
        
        # Caja principal
        ax.add_patch(FancyBboxPatch((x, y - h), w, h + 0.5, boxstyle="round,pad=0.02",
                                     facecolor='white', edgecolor=color, linewidth=2))
        # Header
        ax.add_patch(FancyBboxPatch((x, y), w, 0.5, boxstyle="round,pad=0.01,rounding_size=0.02",
                                     facecolor=color, edgecolor=color, linewidth=1))
        ax.text(x + w/2, y + 0.25, title, ha='center', va='center', 
                fontsize=10, fontweight='bold', color='white')
        
        # Campos
        for i, field in enumerate(fields):
            ax.text(x + 0.15, y - 0.2 - i * 0.35, field, 
                    ha='left', va='center', fontsize=8, family='monospace')
    
    # USERS
    draw_entity(0.5, 10, 'users', [
        '_id: ObjectId (PK)',
        'email: String (unique)',
        'password_hash: String',
        'organization: String',
        'role: "promotor" | "miembro"',
        'status: String',
        'contract_signed: Boolean',
        'payment_status: String',
        'created_at: DateTime'
    ], COLORS['primary'])
    
    # DATASETS
    draw_entity(5.5, 10, 'datasets', [
        '_id: ObjectId (PK)',
        'user_id: ObjectId (FK)',
        'title: String',
        'description: String',
        'category: UTP|ICT|FM|SAT',
        'file_path: String',
        'file_size: Number',
        'status: String',
        'dcat_metadata: Object',
        'created_at: DateTime'
    ], COLORS['accent'])
    
    # EVIDENCES
    draw_entity(10.5, 10, 'evidences', [
        '_id: ObjectId (PK)',
        'user_id: ObjectId (FK)',
        'dataset_id: ObjectId (FK)',
        'type: String',
        'hash: String (SHA-256)',
        'pdf_url: String',
        'generated_at: DateTime',
        'verified: Boolean'
    ], COLORS['warning'])
    
    # CONTRACTS
    draw_entity(0.5, 5.5, 'contracts', [
        '_id: ObjectId (PK)',
        'user_id: ObjectId (FK)',
        'signed_at: DateTime',
        'signature_hash: String',
        'pdf_path: String',
        'ip_address: String',
        'version: String'
    ], '#8b5cf6')
    
    # INCIDENTS
    draw_entity(5.5, 5.5, 'incidents', [
        '_id: ObjectId (PK)',
        'user_id: ObjectId (FK)',
        'title: String',
        'description: String',
        'type: String',
        'priority: String',
        'status: String',
        'resolution: String',
        'created_at: DateTime'
    ], COLORS['danger'])
    
    # AUDIT_LOGS
    draw_entity(10.5, 5.5, 'audit_logs', [
        '_id: ObjectId (PK)',
        'user_id: ObjectId (FK)',
        'action: String',
        'entity_type: String',
        'entity_id: String',
        'details: Object',
        'ip_address: String',
        'timestamp: DateTime'
    ], COLORS['dark'])
    
    # GOVERNANCE
    draw_entity(3, 1.5, 'governance', [
        '_id: ObjectId (PK)',
        'committee_members: Array',
        'voting_rules: Object',
        'regulation_version: String',
        'decisions: Array',
        'updated_at: DateTime'
    ], '#0891b2')
    
    # WITHDRAWALS
    draw_entity(8.5, 1.5, 'withdrawals', [
        '_id: ObjectId (PK)',
        'user_id: ObjectId (FK)',
        'reason: String',
        'status: String',
        'requested_at: DateTime',
        'processed_at: DateTime',
        'approved_by: ObjectId'
    ], '#64748b')
    
    # Relaciones (flechas)
    ax.annotate('', xy=(5.4, 8.5), xytext=(4.1, 8.5),
                arrowprops=dict(arrowstyle='->', color='gray', lw=1.5, connectionstyle='arc3,rad=0'))
    ax.annotate('', xy=(10.4, 8.5), xytext=(9.1, 8.5),
                arrowprops=dict(arrowstyle='->', color='gray', lw=1.5))
    ax.annotate('', xy=(0.5, 5.5), xytext=(2, 6.5),
                arrowprops=dict(arrowstyle='->', color='gray', lw=1.5, connectionstyle='arc3,rad=0.2'))
    
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/03_modelo_datos.png", dpi=150, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print(f"✅ Generado: {OUTPUT_DIR}/03_modelo_datos.png")


# ============================================================
# DIAGRAMA 4: Cumplimiento UNE 0087:2025
# ============================================================
def generate_compliance_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(16, 10))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Título
    ax.text(8, 9.5, 'CUMPLIMIENTO UNE 0087:2025',
            ha='center', va='center', fontsize=16, fontweight='bold', color=COLORS['dark'])
    ax.text(8, 9.0, 'Espacios de Datos - Requisitos para su Certificación',
            ha='center', va='center', fontsize=11, style='italic', color=COLORS['secondary'])
    
    # Centro
    center_x, center_y = 8, 5
    
    # Círculo central
    circle = plt.Circle((center_x, center_y), 1.2, color=COLORS['primary'], alpha=0.9)
    ax.add_patch(circle)
    ax.text(center_x, center_y + 0.2, 'ESPACIO DE', ha='center', va='center', 
            fontsize=10, fontweight='bold', color='white')
    ax.text(center_x, center_y - 0.2, 'DATOS FENITEL', ha='center', va='center', 
            fontsize=10, fontweight='bold', color='white')
    
    # Dimensiones
    dimensions = [
        {'name': 'MODELO DE\nNEGOCIO', 'criteria': 'Neg.1, Neg.2, Neg.3', 'color': '#3b82f6', 'pos': (2.5, 7.5)},
        {'name': 'SISTEMA DE\nGOBERNANZA', 'criteria': 'Gob.1-Gob.5', 'color': '#10b981', 'pos': (13.5, 7.5)},
        {'name': 'SOLUCION\nTECNICA', 'criteria': 'Tec.1-Tec.6', 'color': '#f59e0b', 'pos': (2.5, 2.5)},
        {'name': 'INTEROPERABILIDAD', 'criteria': 'Int.1-Int.5', 'color': '#8b5cf6', 'pos': (13.5, 2.5)},
        {'name': 'VERIFICACION\nFUNCIONAL', 'criteria': 'Fun.1-Fun.4', 'color': '#ef4444', 'pos': (8, 1)},
    ]
    
    for dim in dimensions:
        x, y = dim['pos']
        # Caja de dimensión
        create_rounded_box(ax, x - 1.3, y - 0.4, 2.6, 1.2, dim['name'], dim['color'], fontsize=9)
        ax.text(x, y - 0.7, dim['criteria'], ha='center', fontsize=8, color='gray')
        ax.text(x, y + 0.85, 'CUMPLE', ha='center', fontsize=9, fontweight='bold', color='#16a34a')
        
        # Línea al centro
        ax.plot([x, center_x], [y + 0.4, center_y], color=dim['color'], lw=2, alpha=0.5)
    
    # Leyenda de criterios
    ax.text(8, -0.5, 'Todas las dimensiones verificadas según norma UNE 0087:2025', 
            ha='center', fontsize=10, style='italic', color=COLORS['dark'])
    
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/04_cumplimiento_une.png", dpi=150, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print(f"✅ Generado: {OUTPUT_DIR}/04_cumplimiento_une.png")


# ============================================================
# DIAGRAMA 5: Stack Tecnológico
# ============================================================
def generate_tech_stack():
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Título
    ax.text(7, 9.5, 'STACK TECNOLÓGICO',
            ha='center', va='center', fontsize=16, fontweight='bold', color=COLORS['dark'])
    ax.text(7, 9.0, 'Tecnologías utilizadas en el Espacio de Datos FENITEL',
            ha='center', va='center', fontsize=11, style='italic', color=COLORS['secondary'])
    
    # Frontend
    ax.add_patch(FancyBboxPatch((0.5, 6), 4, 2.5, boxstyle="round,pad=0.02", 
                                 facecolor='#e0f2fe', edgecolor=COLORS['react'], linewidth=2))
    ax.text(2.5, 8.2, 'FRONTEND', ha='center', fontsize=12, fontweight='bold', color=COLORS['dark'])
    ax.text(2.5, 7.6, 'React 18', ha='center', fontsize=10, color=COLORS['dark'])
    ax.text(2.5, 7.2, 'Tailwind CSS', ha='center', fontsize=10, color=COLORS['dark'])
    ax.text(2.5, 6.8, 'Shadcn/UI', ha='center', fontsize=10, color=COLORS['dark'])
    ax.text(2.5, 6.4, 'Axios', ha='center', fontsize=10, color=COLORS['dark'])
    
    # Backend
    ax.add_patch(FancyBboxPatch((5, 6), 4, 2.5, boxstyle="round,pad=0.02", 
                                 facecolor='#e8f5e9', edgecolor=COLORS['fastapi'], linewidth=2))
    ax.text(7, 8.2, 'BACKEND', ha='center', fontsize=12, fontweight='bold', color=COLORS['dark'])
    ax.text(7, 7.6, 'FastAPI', ha='center', fontsize=10, color=COLORS['dark'])
    ax.text(7, 7.2, 'Python 3.11', ha='center', fontsize=10, color=COLORS['dark'])
    ax.text(7, 6.8, 'JWT Auth', ha='center', fontsize=10, color=COLORS['dark'])
    ax.text(7, 6.4, 'ReportLab (PDF)', ha='center', fontsize=10, color=COLORS['dark'])
    
    # Database
    ax.add_patch(FancyBboxPatch((9.5, 6), 4, 2.5, boxstyle="round,pad=0.02", 
                                 facecolor='#ecfdf5', edgecolor=COLORS['mongo'], linewidth=2))
    ax.text(11.5, 8.2, 'BASE DE DATOS', ha='center', fontsize=12, fontweight='bold', color=COLORS['dark'])
    ax.text(11.5, 7.6, 'MongoDB 7', ha='center', fontsize=10, color=COLORS['dark'])
    ax.text(11.5, 7.2, 'Docker Container', ha='center', fontsize=10, color=COLORS['dark'])
    ax.text(11.5, 6.8, 'PyMongo', ha='center', fontsize=10, color=COLORS['dark'])
    
    # Infraestructura
    ax.add_patch(FancyBboxPatch((2.5, 2.5), 9, 2.5, boxstyle="round,pad=0.02", 
                                 facecolor='#fef3c7', edgecolor=COLORS['warning'], linewidth=2))
    ax.text(7, 4.7, 'INFRAESTRUCTURA', ha='center', fontsize=12, fontweight='bold', color=COLORS['dark'])
    
    infra_items = [
        ('Ubuntu 24.04', 3.5, 3.8),
        ('Nginx', 5.5, 3.8),
        ('Systemd', 7.5, 3.8),
        ('Docker', 9.5, 3.8),
    ]
    for item, x, y in infra_items:
        create_rounded_box(ax, x - 0.8, y - 0.4, 1.6, 0.6, item, COLORS['dark'], fontsize=8)
    
    # Seguridad
    ax.add_patch(FancyBboxPatch((2.5, 0.5), 9, 1.5, boxstyle="round,pad=0.02", 
                                 facecolor='#fee2e2', edgecolor=COLORS['danger'], linewidth=2))
    ax.text(7, 1.7, 'SEGURIDAD', ha='center', fontsize=12, fontweight='bold', color=COLORS['dark'])
    ax.text(7, 1.2, 'JWT Tokens  •  SHA-256 Signatures  •  HTTPS  •  Role-Based Access', 
            ha='center', fontsize=9, color=COLORS['dark'])
    
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/05_stack_tecnologico.png", dpi=150, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close()
    print(f"✅ Generado: {OUTPUT_DIR}/05_stack_tecnologico.png")


# ============================================================
# EJECUTAR TODOS LOS DIAGRAMAS
# ============================================================
if __name__ == "__main__":
    print("🎨 Generando diagramas de arquitectura...")
    print(f"📁 Directorio de salida: {OUTPUT_DIR}\n")
    
    generate_system_architecture()
    generate_incorporation_flow()
    generate_data_model()
    generate_compliance_diagram()
    generate_tech_stack()
    
    print(f"\n✅ Todos los diagramas generados en {OUTPUT_DIR}/")
    print("\nArchivos disponibles:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith('.png'):
            size = os.path.getsize(f"{OUTPUT_DIR}/{f}") / 1024
            print(f"  📊 {f} ({size:.1f} KB)")
