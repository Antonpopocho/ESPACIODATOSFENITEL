"""
FENITEL Espacio de Datos - Certificate Service
Servicio de generación de certificados/evidencias
Orden TDF/758/2025
"""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Configuration
SPACE_NAME = "Espacio de Datos Sectorial FENITEL"
PROMOTER = "FENITEL - Federación Nacional de Instaladores de Telecomunicaciones"
SPACE_IDENTIFIER = "FENITEL-EDS-2025"
ISSUER = "FENITEL como Promotor del Espacio de Datos"


def generate_signature_hash(data: dict) -> str:
    """Generate SHA-256 hash for digital signature"""
    data_str = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(data_str.encode()).hexdigest()


def generate_membership_certificate(
    output_path: Path,
    member_id: str,
    organization_name: str,
    cif: str,
    role: str,
    date_joined: str,
    contract_reference: str,
    email: str,
    address: str = None
) -> tuple[str, str]:
    """
    Generate membership registration certificate PDF
    
    Returns: (pdf_path, certificate_hash)
    """
    
    doc = SimpleDocTemplate(
        str(output_path), 
        pagesize=A4,
        rightMargin=2*cm, 
        leftMargin=2*cm,
        topMargin=2*cm, 
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title', 
        parent=styles['Heading1'],
        fontSize=20, 
        alignment=TA_CENTER, 
        spaceAfter=10,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        alignment=TA_CENTER,
        fontSize=14,
        spaceAfter=30,
        textColor=colors.HexColor('#0284C7')
    )
    header_style = ParagraphStyle(
        'Header', 
        parent=styles['Heading2'],
        fontSize=13, 
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#0F172A')
    )
    normal_style = ParagraphStyle(
        'Normal', 
        parent=styles['Normal'],
        fontSize=10, 
        spaceAfter=6
    )
    mono_style = ParagraphStyle(
        'Mono', 
        parent=styles['Normal'],
        fontSize=8, 
        fontName='Courier',
        spaceAfter=6
    )
    footer_style = ParagraphStyle(
        'Footer',
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.gray
    )
    
    story = []
    
    # === HEADER ===
    story.append(Paragraph("CERTIFICADO DE REGISTRO DE MIEMBRO", title_style))
    story.append(Paragraph(SPACE_NAME, subtitle_style))
    story.append(Paragraph("Orden TDF/758/2025 - Kit Espacios de Datos", 
                          ParagraphStyle('Ref', alignment=TA_CENTER, fontSize=10, spaceAfter=30, textColor=colors.gray)))
    
    # === DATOS DEL ESPACIO ===
    story.append(Paragraph("DATOS DEL ESPACIO DE DATOS", header_style))
    space_data = [
        ["Nombre del Espacio:", SPACE_NAME],
        ["Identificador:", SPACE_IDENTIFIER],
        ["Promotor:", PROMOTER],
        ["Emisor:", ISSUER],
    ]
    space_table = Table(space_data, colWidths=[5*cm, 10*cm])
    space_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(space_table)
    
    # === DATOS DEL MIEMBRO ===
    story.append(Paragraph("DATOS DEL MIEMBRO REGISTRADO", header_style))
    member_data = [
        ["ID Miembro:", member_id],
        ["Organización:", organization_name],
        ["CIF/NIF:", cif],
        ["Email:", email],
        ["Rol:", role.upper()],
        ["Fecha de Registro:", date_joined],
        ["Referencia Contrato:", contract_reference],
    ]
    if address:
        member_data.append(["Dirección:", address])
    
    member_table = Table(member_data, colWidths=[5*cm, 10*cm])
    member_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(member_table)
    
    # === DECLARACIÓN ===
    story.append(Spacer(1, 20))
    story.append(Paragraph("DECLARACIÓN", header_style))
    declaration_text = f"""
    Por medio del presente certificado, {PROMOTER} certifica que la organización 
    <b>{organization_name}</b> con CIF/NIF <b>{cif}</b> ha sido registrada como miembro 
    del {SPACE_NAME} con fecha <b>{date_joined}</b>, cumpliendo con los requisitos 
    establecidos en la Orden TDF/758/2025 para la incorporación efectiva al espacio de datos.
    """
    story.append(Paragraph(declaration_text, normal_style))
    
    # === FIRMA DIGITAL ===
    story.append(Spacer(1, 20))
    story.append(Paragraph("FIRMA ELECTRÓNICA", header_style))
    
    timestamp = datetime.now(timezone.utc)
    hash_data = {
        "certificate_type": "membership_registration",
        "space_identifier": SPACE_IDENTIFIER,
        "member_id": member_id,
        "organization_name": organization_name,
        "cif": cif,
        "role": role,
        "date_joined": date_joined,
        "contract_reference": contract_reference,
        "timestamp": timestamp.isoformat(),
        "issuer": ISSUER
    }
    certificate_hash = generate_signature_hash(hash_data)
    
    signature_data = [
        ["Fecha de Emisión:", timestamp.strftime("%d/%m/%Y %H:%M:%S UTC")],
        ["Algoritmo:", "SHA-256"],
        ["Hash del Certificado:", ""],
    ]
    sig_table = Table(signature_data, colWidths=[5*cm, 10*cm])
    sig_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(sig_table)
    story.append(Paragraph(certificate_hash, mono_style))
    
    # === FOOTER ===
    story.append(Spacer(1, 40))
    story.append(Paragraph(
        "Este certificado constituye evidencia de registro conforme a la Orden TDF/758/2025.",
        footer_style
    ))
    story.append(Paragraph(PROMOTER, footer_style))
    
    doc.build(story)
    
    return str(output_path), certificate_hash


def generate_dataset_publication_certificate(
    output_path: Path,
    dataset_id: str,
    dataset_title: str,
    provider_name: str,
    provider_cif: str,
    provider_email: str,
    publication_date: str,
    metadata_reference: str,
    dataset_description: str = None,
    dataset_category: str = None,
    dataset_license: str = None
) -> tuple[str, str]:
    """
    Generate dataset publication certificate PDF
    
    Returns: (pdf_path, certificate_hash)
    """
    
    doc = SimpleDocTemplate(
        str(output_path), 
        pagesize=A4,
        rightMargin=2*cm, 
        leftMargin=2*cm,
        topMargin=2*cm, 
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title', 
        parent=styles['Heading1'],
        fontSize=20, 
        alignment=TA_CENTER, 
        spaceAfter=10,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        alignment=TA_CENTER,
        fontSize=14,
        spaceAfter=30,
        textColor=colors.HexColor('#059669')
    )
    header_style = ParagraphStyle(
        'Header', 
        parent=styles['Heading2'],
        fontSize=13, 
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#0F172A')
    )
    normal_style = ParagraphStyle(
        'Normal', 
        parent=styles['Normal'],
        fontSize=10, 
        spaceAfter=6
    )
    mono_style = ParagraphStyle(
        'Mono', 
        parent=styles['Normal'],
        fontSize=8, 
        fontName='Courier',
        spaceAfter=6
    )
    footer_style = ParagraphStyle(
        'Footer',
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.gray
    )
    
    story = []
    
    # === HEADER ===
    story.append(Paragraph("CERTIFICADO DE PUBLICACIÓN DE DATASET", title_style))
    story.append(Paragraph("Catálogo DCAT-AP del Espacio de Datos", subtitle_style))
    story.append(Paragraph("Orden TDF/758/2025 - Kit Espacios de Datos", 
                          ParagraphStyle('Ref', alignment=TA_CENTER, fontSize=10, spaceAfter=30, textColor=colors.gray)))
    
    # === DATOS DEL ESPACIO ===
    story.append(Paragraph("DATOS DEL ESPACIO DE DATOS", header_style))
    space_data = [
        ["Nombre del Espacio:", SPACE_NAME],
        ["Identificador:", SPACE_IDENTIFIER],
        ["Promotor:", PROMOTER],
    ]
    space_table = Table(space_data, colWidths=[5*cm, 10*cm])
    space_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(space_table)
    
    # === DATOS DEL DATASET ===
    story.append(Paragraph("DATOS DEL DATASET PUBLICADO", header_style))
    dataset_data = [
        ["ID Dataset:", dataset_id],
        ["Título:", dataset_title],
        ["Fecha de Publicación:", publication_date],
        ["Referencia Metadatos:", metadata_reference],
    ]
    if dataset_description:
        dataset_data.append(["Descripción:", dataset_description[:100] + "..." if len(dataset_description) > 100 else dataset_description])
    if dataset_category:
        dataset_data.append(["Categoría:", dataset_category])
    if dataset_license:
        dataset_data.append(["Licencia:", dataset_license])
    
    dataset_table = Table(dataset_data, colWidths=[5*cm, 10*cm])
    dataset_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(dataset_table)
    
    # === DATOS DEL PROVEEDOR ===
    story.append(Paragraph("DATOS DEL PROVEEDOR", header_style))
    provider_data = [
        ["Organización:", provider_name],
        ["CIF/NIF:", provider_cif],
        ["Email:", provider_email],
    ]
    provider_table = Table(provider_data, colWidths=[5*cm, 10*cm])
    provider_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(provider_table)
    
    # === DECLARACIÓN ===
    story.append(Spacer(1, 20))
    story.append(Paragraph("DECLARACIÓN", header_style))
    declaration_text = f"""
    Por medio del presente certificado, {PROMOTER} certifica que el dataset 
    <b>"{dataset_title}"</b> proporcionado por <b>{provider_name}</b> (CIF/NIF: {provider_cif}) 
    ha sido publicado en el catálogo DCAT-AP del {SPACE_NAME} con fecha <b>{publication_date}</b>, 
    tras superar el proceso de validación técnica establecido conforme a la Orden TDF/758/2025.
    """
    story.append(Paragraph(declaration_text, normal_style))
    
    # === FIRMA DIGITAL ===
    story.append(Spacer(1, 20))
    story.append(Paragraph("FIRMA ELECTRÓNICA", header_style))
    
    timestamp = datetime.now(timezone.utc)
    hash_data = {
        "certificate_type": "dataset_publication",
        "space_identifier": SPACE_IDENTIFIER,
        "dataset_id": dataset_id,
        "dataset_title": dataset_title,
        "provider_name": provider_name,
        "provider_cif": provider_cif,
        "publication_date": publication_date,
        "metadata_reference": metadata_reference,
        "timestamp": timestamp.isoformat(),
        "issuer": ISSUER
    }
    certificate_hash = generate_signature_hash(hash_data)
    
    signature_data = [
        ["Fecha de Emisión:", timestamp.strftime("%d/%m/%Y %H:%M:%S UTC")],
        ["Algoritmo:", "SHA-256"],
        ["Hash del Certificado:", ""],
    ]
    sig_table = Table(signature_data, colWidths=[5*cm, 10*cm])
    sig_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(sig_table)
    story.append(Paragraph(certificate_hash, mono_style))
    
    # === FOOTER ===
    story.append(Spacer(1, 40))
    story.append(Paragraph(
        "Este certificado constituye evidencia de publicación conforme a la Orden TDF/758/2025.",
        footer_style
    ))
    story.append(Paragraph(PROMOTER, footer_style))
    
    doc.build(story)
    
    return str(output_path), certificate_hash
