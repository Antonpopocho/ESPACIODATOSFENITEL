#!/usr/bin/env python3
"""
Generador de capturas de pantalla del Proceso de Transacción de Datos
"""
import asyncio
from playwright.async_api import async_playwright
import os

SCREENSHOTS_DIR = "/app/storage/screenshots/transaccion"
BASE_URL = "https://fenitel-datos.preview.emergentagent.com"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 900})
        page = await context.new_page()
        
        # Login como miembro consumidor
        print("Iniciando sesión como consumidor de datos...")
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        await page.fill('input[placeholder="tu@email.com"]', 'empresa@demo.com')
        await page.fill('input[type="password"]', 'Demo123456!')
        await page.click('button:has-text("Iniciar Sesión")')
        await asyncio.sleep(3)
        
        # 1. Dashboard del consumidor - Estado de incorporación
        print("1/12 Capturando estado de incorporación del consumidor...")
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/01_estado_incorporacion.png")
        
        # 2. Verificar contrato firmado
        print("2/12 Capturando contrato firmado...")
        await page.click('text=Mi Contrato')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/02_contrato_firmado.png")
        
        # 3. Acceso al catálogo
        print("3/12 Capturando acceso al catálogo...")
        await page.click('text=Catálogo Sectorial')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/03_catalogo_disponible.png")
        
        # 4. Selección de un dataset para adquirir
        print("4/12 Capturando selección de dataset...")
        # Hacer scroll si es necesario para ver los datasets
        await page.evaluate("window.scrollTo(0, 300)")
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/04_seleccion_dataset.png")
        
        # 5. Ver detalles del dataset con condiciones
        print("5/12 Capturando detalles y condiciones del dataset...")
        try:
            detalles_btn = page.locator('button:has-text("Detalles")').first
            if await detalles_btn.count() > 0:
                await detalles_btn.click()
                await asyncio.sleep(1.5)
                await page.screenshot(path=f"{SCREENSHOTS_DIR}/05_detalles_condiciones.png")
                # Cerrar diálogo con ESC o click fuera
                await page.keyboard.press("Escape")
                await asyncio.sleep(1)
        except:
            await page.screenshot(path=f"{SCREENSHOTS_DIR}/05_detalles_condiciones.png")
        
        # 6. Proceso de descarga - Click en descargar
        print("6/12 Capturando inicio de descarga...")
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/06_iniciar_descarga.png")
        
        # 7. Ejecutar descarga
        print("7/12 Ejecutando descarga del dataset...")
        try:
            descargar_btn = page.locator('button:has-text("Descargar")').first
            if await descargar_btn.count() > 0:
                # Configurar para capturar la descarga
                async with page.expect_download(timeout=10000) as download_info:
                    await descargar_btn.click(force=True)
                download = await download_info.value
                # Guardar archivo descargado
                await download.save_as(f"{SCREENSHOTS_DIR}/dataset_descargado.csv")
                await asyncio.sleep(2)
        except Exception as e:
            print(f"  Nota: {e}")
            await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/07_descarga_completada.png")
        
        # 8. Ver evidencias generadas
        print("8/12 Capturando evidencias del consumidor...")
        # Asegurar que no hay diálogos abiertos
        await page.keyboard.press("Escape")
        await asyncio.sleep(0.5)
        await page.click('text=Mis Evidencias', force=True)
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/08_evidencias_consumidor.png")
        
        # Cerrar sesión y entrar como promotor para ver auditoría
        await browser.close()
        
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
        
        # 9. Ver registro de auditoría de la transacción
        print("9/12 Capturando registro de auditoría...")
        await page.click('text=Auditoría')
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/09_auditoria_transaccion.png")
        
        # 10. Filtrar por acciones de datasets
        print("10/12 Capturando filtro de transacciones...")
        try:
            filtro = page.locator('select, [role="combobox"]').first
            if await filtro.count() > 0:
                await filtro.click()
                await asyncio.sleep(0.5)
        except:
            pass
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/10_filtro_transacciones.png")
        
        # 11. Ver estadísticas de datasets
        print("11/12 Capturando estadísticas de uso...")
        await page.goto(f"{BASE_URL}/dashboard")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/11_estadisticas_uso.png")
        
        # 12. Ver gestión de datasets con descargas
        print("12/12 Capturando registro de descargas...")
        await page.click('text=Datasets', force=True)
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/12_registro_descargas.png")
        
        await browser.close()
        
        print(f"\n✅ Capturas de transacción guardadas en {SCREENSHOTS_DIR}/")
        for f in sorted(os.listdir(SCREENSHOTS_DIR)):
            if f.endswith('.png'):
                size = os.path.getsize(f"{SCREENSHOTS_DIR}/{f}") / 1024
                print(f"  📸 {f} ({size:.1f} KB)")

if __name__ == "__main__":
    asyncio.run(main())
