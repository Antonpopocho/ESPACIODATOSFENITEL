#!/usr/bin/env python3
"""
Generador de capturas de pantalla del Catálogo de Datos
"""
import asyncio
from playwright.async_api import async_playwright
import os

SCREENSHOTS_DIR = "/app/storage/screenshots/catalogo"
BASE_URL = "https://fenitel-datos.preview.emergentagent.com"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 900})
        page = await context.new_page()
        
        # Login como miembro
        print("Iniciando sesión como miembro...")
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        await page.fill('input[placeholder="tu@email.com"]', 'empresa@demo.com')
        await page.fill('input[type="password"]', 'Demo123456!')
        await page.click('button:has-text("Iniciar Sesión")')
        await asyncio.sleep(3)
        
        # 1. Acceso al catálogo desde el menú
        print("1/8 Capturando acceso al catálogo desde menú...")
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/01_menu_catalogo.png")
        
        # 2. Vista general del catálogo
        print("2/8 Capturando vista general del catálogo...")
        await page.click('text=Catálogo Sectorial')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/02_catalogo_general.png")
        
        # 3. Filtro por categoría UTP
        print("3/8 Capturando filtro categoría UTP...")
        await page.click('button:has-text("UTP")')
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/03_filtro_utp.png")
        
        # 4. Filtro por categoría ICT
        print("4/8 Capturando filtro categoría ICT...")
        await page.click('button:has-text("ICT")')
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/04_filtro_ict.png")
        
        # 5. Filtro por categoría FM
        print("5/8 Capturando filtro categoría FM...")
        await page.click('button:has-text("FM")')
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/05_filtro_fm.png")
        
        # 6. Filtro por categoría SAT
        print("6/8 Capturando filtro categoría SAT...")
        await page.click('button:has-text("SAT")')
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/06_filtro_sat.png")
        
        # 7. Volver a todas las categorías y ver detalles de un dataset
        print("7/8 Capturando detalles de dataset...")
        # Buscar botón de filtro "Todas" o similar
        try:
            todas_btn = page.locator('button:has-text("Todas")')
            if await todas_btn.count() > 0:
                await todas_btn.click()
                await asyncio.sleep(1)
        except:
            pass
        
        # Click en el botón Detalles del primer dataset
        try:
            detalles_btn = page.locator('button:has-text("Detalles")').first
            if await detalles_btn.count() > 0:
                await detalles_btn.click()
                await asyncio.sleep(1.5)
                await page.screenshot(path=f"{SCREENSHOTS_DIR}/07_detalles_dataset.png")
                # Cerrar el diálogo
                close_btn = page.locator('button:has-text("Cerrar")')
                if await close_btn.count() > 0:
                    await close_btn.click()
                    await asyncio.sleep(0.5)
            else:
                await page.screenshot(path=f"{SCREENSHOTS_DIR}/07_detalles_dataset.png")
        except:
            await page.screenshot(path=f"{SCREENSHOTS_DIR}/07_detalles_dataset.png")
        
        # 8. Funcionalidad de búsqueda
        print("8/8 Capturando búsqueda en catálogo...")
        try:
            search_input = page.locator('input[placeholder*="Buscar"]')
            if await search_input.count() > 0:
                await search_input.fill('comunicaciones')
                await asyncio.sleep(1)
        except:
            pass
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/08_busqueda_catalogo.png")
        
        await browser.close()
        
        print(f"\n✅ Capturas del catálogo guardadas en {SCREENSHOTS_DIR}/")
        for f in sorted(os.listdir(SCREENSHOTS_DIR)):
            if f.endswith('.png'):
                size = os.path.getsize(f"{SCREENSHOTS_DIR}/{f}") / 1024
                print(f"  📸 {f} ({size:.1f} KB)")

if __name__ == "__main__":
    asyncio.run(main())
