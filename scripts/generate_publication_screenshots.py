#!/usr/bin/env python3
"""
Generador de capturas de pantalla del Proceso de Publicación de Datasets
"""
import asyncio
from playwright.async_api import async_playwright
import os

SCREENSHOTS_DIR = "/app/storage/screenshots/publicacion"
BASE_URL = "https://fenitel-datos.preview.emergentagent.com"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 900})
        page = await context.new_page()
        
        # Login como miembro proveedor
        print("Iniciando sesión como proveedor de datos...")
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        await page.fill('input[placeholder="tu@email.com"]', 'empresa@demo.com')
        await page.fill('input[type="password"]', 'Demo123456!')
        await page.click('button:has-text("Iniciar Sesión")')
        await asyncio.sleep(3)
        
        # 1. Dashboard del proveedor con acceso a datasets
        print("1/10 Capturando dashboard del proveedor...")
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/01_dashboard_proveedor.png")
        
        # 2. Acceso a sección Mis Datasets
        print("2/10 Capturando sección Mis Datasets...")
        await page.click('text=Mis Datasets')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/02_mis_datasets.png")
        
        # 3. Formulario de subida de nuevo dataset
        print("3/10 Capturando formulario de subida...")
        # Buscar botón de nuevo dataset o subir
        try:
            nuevo_btn = page.locator('button:has-text("Nuevo Dataset")')
            if await nuevo_btn.count() > 0:
                await nuevo_btn.click()
                await asyncio.sleep(1.5)
            else:
                subir_btn = page.locator('button:has-text("Subir")')
                if await subir_btn.count() > 0:
                    await subir_btn.click()
                    await asyncio.sleep(1.5)
        except:
            pass
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/03_formulario_subida.png")
        
        # 4. Rellenar datos del dataset
        print("4/10 Capturando formulario con datos...")
        try:
            # Rellenar título
            titulo_input = page.locator('input[placeholder*="Título"]')
            if await titulo_input.count() > 0:
                await titulo_input.fill('Infraestructuras ICT Zona Norte 2026')
            
            # Rellenar descripción
            desc_input = page.locator('textarea[placeholder*="Descripción"]')
            if await desc_input.count() > 0:
                await desc_input.fill('Datos de infraestructuras comunes de telecomunicaciones en edificios de la zona norte. Incluye información de canalizaciones, registros y equipamiento de cabecera.')
            
            await asyncio.sleep(0.5)
        except:
            pass
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/04_formulario_datos.png")
        
        # 5. Selección de categoría
        print("5/10 Capturando selección de categoría...")
        try:
            # Buscar selector de categoría
            cat_select = page.locator('select, [role="combobox"]').first
            if await cat_select.count() > 0:
                await cat_select.click()
                await asyncio.sleep(0.5)
        except:
            pass
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/05_seleccion_categoria.png")
        
        # Cerrar navegador y abrir como promotor
        await browser.close()
        
        # Nueva sesión como promotor
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 900})
        page = await context.new_page()
        
        print("Iniciando sesión como promotor...")
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        await page.fill('input[placeholder="tu@email.com"]', 'admin@fenitel.es')
        await page.fill('input[type="password"]', 'FenitelAdmin2025!')
        await page.click('button:has-text("Iniciar Sesión")')
        await asyncio.sleep(3)
        
        # 6. Dashboard del promotor
        print("6/10 Capturando dashboard promotor...")
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/06_dashboard_promotor.png")
        
        # 7. Gestión de datasets
        print("7/10 Capturando gestión de datasets...")
        await page.click('text=Datasets')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/07_gestion_datasets.png")
        
        # 8. Lista de datasets pendientes de validación
        print("8/10 Capturando datasets pendientes...")
        try:
            pendientes_tab = page.locator('button:has-text("Pendientes")')
            if await pendientes_tab.count() > 0:
                await pendientes_tab.click()
                await asyncio.sleep(1)
        except:
            pass
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/08_datasets_pendientes.png")
        
        # 9. Validación de un dataset
        print("9/10 Capturando proceso de validación...")
        try:
            validar_btn = page.locator('button:has-text("Validar")').first
            if await validar_btn.count() > 0:
                await validar_btn.click()
                await asyncio.sleep(1.5)
        except:
            pass
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/09_validacion_dataset.png")
        
        # 10. Catálogo con dataset publicado
        print("10/10 Capturando catálogo con publicación...")
        await page.click('text=Catálogo Sectorial')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/10_catalogo_publicado.png")
        
        await browser.close()
        
        print(f"\n✅ Capturas de publicación guardadas en {SCREENSHOTS_DIR}/")
        for f in sorted(os.listdir(SCREENSHOTS_DIR)):
            if f.endswith('.png'):
                size = os.path.getsize(f"{SCREENSHOTS_DIR}/{f}") / 1024
                print(f"  📸 {f} ({size:.1f} KB)")

if __name__ == "__main__":
    asyncio.run(main())
