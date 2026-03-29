#!/usr/bin/env python3
"""
Generador de capturas de pantalla del proceso de adhesión
"""
import asyncio
from playwright.async_api import async_playwright
import os

SCREENSHOTS_DIR = "/app/storage/screenshots"
BASE_URL = "https://fenitel-datos.preview.emergentagent.com"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 900})
        page = await context.new_page()
        
        # 1. Landing Page
        print("1/11 Capturando Landing Page...")
        await page.goto(BASE_URL)
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/01_landing_page.png")
        
        # 2. Formulario de registro vacío
        print("2/11 Capturando formulario de registro...")
        await page.click("text=Solicitar Adhesión")
        await asyncio.sleep(1.5)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/02_formulario_registro.png")
        
        # 3. Formulario completo
        print("3/11 Capturando formulario completado...")
        await page.fill('input[placeholder="Empresa S.L."]', 'Instalaciones Técnicas Madrid S.L.')
        await page.fill('input[placeholder="B12345678"]', 'B87654321')
        await page.fill('input[placeholder="Nombre de la organización"]', 'Instalaciones Técnicas Madrid')
        await page.fill('input[placeholder="contacto@empresa.com"]', 'contacto@intecmadrid.es')
        await page.fill('input[placeholder="+34 600 000 000"]', '+34 912 345 678')
        await page.fill('input[placeholder="Calle, número, ciudad"]', 'Calle Gran Vía 45, 28013 Madrid')
        await page.fill('input[placeholder="Mínimo 8 caracteres"]', 'SecurePass2025!')
        await page.fill('input[placeholder="Repite la contraseña"]', 'SecurePass2025!')
        await asyncio.sleep(0.5)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/03_formulario_completo.png")
        
        # 4. Pantalla de login
        print("4/11 Capturando pantalla de login...")
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/04_login.png")
        
        # 5. Dashboard miembro
        print("5/11 Capturando dashboard miembro...")
        await page.fill('input[placeholder="tu@email.com"]', 'empresa@demo.com')
        await page.fill('input[type="password"]', 'Demo123456!')
        await page.click('button:has-text("Iniciar Sesión")')
        await asyncio.sleep(3)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/05_dashboard_miembro.png")
        
        # 6. Contrato
        print("6/11 Capturando contrato...")
        await page.click('text=Mi Contrato')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/06_contrato.png")
        
        # 7. Evidencias
        print("7/11 Capturando evidencias...")
        await page.click('text=Mis Evidencias')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/07_evidencias.png")
        
        # 8. Catálogo
        print("8/11 Capturando catálogo...")
        await page.click('text=Catálogo Sectorial')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/08_catalogo.png")
        
        # Crear nuevo contexto para promotor
        await browser.close()
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 900})
        page = await context.new_page()
        
        # Navegar a login
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        
        # 9. Dashboard promotor
        print("9/11 Capturando dashboard promotor...")
        await page.fill('input[placeholder="tu@email.com"]', 'admin@fenitel.es')
        await page.fill('input[type="password"]', 'FenitelAdmin2025!')
        await page.click('button:has-text("Iniciar Sesión")')
        await asyncio.sleep(3)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/09_dashboard_promotor.png")
        
        # 10. Gestión miembros
        print("10/11 Capturando gestión de miembros...")
        await page.click('text=Miembros')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/10_gestion_miembros.png")
        
        # 11. Auditoría
        print("11/11 Capturando auditoría...")
        await page.click('text=Auditoría')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/11_auditoria.png")
        
        await browser.close()
        
        print(f"\n✅ Todas las capturas guardadas en {SCREENSHOTS_DIR}/")
        for f in sorted(os.listdir(SCREENSHOTS_DIR)):
            if f.endswith('.png'):
                size = os.path.getsize(f"{SCREENSHOTS_DIR}/{f}") / 1024
                print(f"  📸 {f} ({size:.1f} KB)")

if __name__ == "__main__":
    asyncio.run(main())
