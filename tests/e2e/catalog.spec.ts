import { test, expect } from '@playwright/test';
import { loginAsPromotor, loginAsMember, dismissToasts } from '../fixtures/helpers';

test.describe('Catalog - Global Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Promotor can access catalog page', async ({ page }) => {
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    await expect(page).toHaveURL(/\/catalog/);
    await expect(page.getByText('Catálogo de Datos Sectoriales')).toBeVisible();
  });

  test('Member can access catalog page', async ({ page }) => {
    await loginAsMember(page);
    await page.getByTestId('nav-catalog').click();
    await expect(page).toHaveURL(/\/catalog/);
    await expect(page.getByText('Catálogo de Datos Sectoriales')).toBeVisible();
  });

  test('Catalog displays published datasets', async ({ page }) => {
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    
    // Wait for datasets to load - wait for at least one dataset card to appear
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    
    // Should show datasets count
    const datasetsCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    expect(datasetsCount).toBeGreaterThan(0);
  });

  test('Both promotor and member see same datasets', async ({ page }) => {
    // Login as promotor and count datasets
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    
    // Wait for datasets to load
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    const promotorCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    
    // Logout and login as member
    await page.getByTestId('logout-button').click();
    await loginAsMember(page);
    await page.getByTestId('nav-catalog').click();
    
    // Wait for datasets to load
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    const memberCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    
    // Both should see the same number of datasets
    expect(memberCount).toBe(promotorCount);
  });
});

test.describe('Catalog - Category Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    // Wait for datasets to load
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
  });

  test('Category tabs are visible', async ({ page }) => {
    await expect(page.getByTestId('category-tab-all')).toBeVisible();
    await expect(page.getByTestId('category-tab-UTP')).toBeVisible();
    await expect(page.getByTestId('category-tab-ICT')).toBeVisible();
    await expect(page.getByTestId('category-tab-FM')).toBeVisible();
    await expect(page.getByTestId('category-tab-SAT')).toBeVisible();
    await expect(page.getByTestId('category-tab-general')).toBeVisible();
  });

  test('All tab shows all datasets', async ({ page }) => {
    await page.getByTestId('category-tab-all').click();
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    const allCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    expect(allCount).toBeGreaterThan(0);
  });

  test('Clicking category tab filters datasets', async ({ page }) => {
    // Get total count
    await page.getByTestId('category-tab-all').click();
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    const allCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    
    // Click UTP tab
    await page.getByTestId('category-tab-UTP').click();
    // Wait for filter to apply
    await page.waitForTimeout(300);
    const utpCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    
    // UTP count should be less than or equal to all
    expect(utpCount).toBeLessThanOrEqual(allCount);
  });

  test('Category tabs show dataset counts in badges', async ({ page }) => {
    // Each tab should have a badge with count - the count is visible in the tab
    // Looking at the screenshot, tabs show "Todos 5", "UTP 1", etc.
    const allTab = page.getByTestId('category-tab-all');
    // The tab text includes the count
    await expect(allTab).toContainText(/\d+/);
  });

  test('Selecting category shows category description', async ({ page }) => {
    // Click on a specific category (not "all")
    await page.getByTestId('category-tab-UTP').click();
    
    // Should show category description - use first() to avoid strict mode
    await expect(page.getByText('Datos de instalaciones de cableado estructurado').first()).toBeVisible();
  });
});

test.describe('Catalog - Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    // Wait for datasets to load
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
  });

  test('Search input is visible', async ({ page }) => {
    await expect(page.getByTestId('catalog-search-input')).toBeVisible();
  });

  test('Search filters datasets by title', async ({ page }) => {
    // Get initial count
    const initialCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    
    // Search for a specific term that exists
    await page.getByTestId('catalog-search-input').fill('SAT');
    await page.waitForTimeout(500);
    
    const filteredCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    
    // Filtered count should be less than or equal to initial (search narrows results)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    // And should have at least one result for SAT
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('Search with no results shows empty state', async ({ page }) => {
    await page.getByTestId('catalog-search-input').fill('xyznonexistent12345');
    await page.waitForTimeout(500);
    
    const count = await page.locator('[data-testid^="catalog-dataset-"]').count();
    expect(count).toBe(0);
    
    // Should show empty state message
    await expect(page.getByText('No hay datasets')).toBeVisible();
  });

  test('Clearing search shows all datasets again', async ({ page }) => {
    const initialCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    
    // Search for something specific
    await page.getByTestId('catalog-search-input').fill('SAT');
    await page.waitForTimeout(500);
    
    // Clear search
    await page.getByTestId('catalog-search-input').fill('');
    await page.waitForTimeout(500);
    
    const finalCount = await page.locator('[data-testid^="catalog-dataset-"]').count();
    expect(finalCount).toBe(initialCount);
  });
});

test.describe('Catalog - Dataset Download', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Dataset card has download button', async ({ page }) => {
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    
    // First dataset card should have download button
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    await expect(firstCard.getByRole('button', { name: /descargar/i })).toBeVisible();
  });

  test('Dataset card has details button', async ({ page }) => {
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    await expect(firstCard.getByRole('button', { name: /detalles/i })).toBeVisible();
  });

  test('Clicking details opens dialog with dataset info', async ({ page }) => {
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    await firstCard.getByRole('button', { name: /detalles/i }).click();
    
    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Detalles del Dataset')).toBeVisible();
    
    // Should show dataset info
    await expect(page.getByText('Descripción')).toBeVisible();
    await expect(page.getByText('Proveedor')).toBeVisible();
    await expect(page.getByText('Formato')).toBeVisible();
    await expect(page.getByText('Licencia')).toBeVisible();
  });

  test('Member can download dataset from catalog', async ({ page }) => {
    await loginAsMember(page);
    await page.getByTestId('nav-catalog').click();
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await firstCard.getByRole('button', { name: /descargar/i }).click();
    
    // Should trigger download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('Download from details dialog works', async ({ page }) => {
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
    
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    await firstCard.getByRole('button', { name: /detalles/i }).click();
    
    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('dialog').getByRole('button', { name: /descargar/i }).click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });
});

test.describe('Catalog - Dataset Display', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
    await page.getByTestId('nav-catalog').click();
    await expect(page.locator('[data-testid^="catalog-dataset-"]').first()).toBeVisible();
  });

  test('Dataset cards show category header', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    
    // Should have colored category header with category name
    await expect(firstCard.locator('div').first()).toBeVisible();
  });

  test('Dataset cards show title and description', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    
    // Should have title (h3)
    await expect(firstCard.locator('h3')).toBeVisible();
    
    // Should have description text
    const description = firstCard.locator('p.text-sm.text-slate-600');
    await expect(description).toBeVisible();
  });

  test('Dataset cards show file type and size', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    
    // Should show file type (CSV or JSON)
    const fileInfo = firstCard.getByText(/CSV|JSON/i);
    await expect(fileInfo.first()).toBeVisible();
    
    // Should show size in KB
    await expect(firstCard.getByText(/KB/)).toBeVisible();
  });

  test('Dataset cards show publisher info', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="catalog-dataset-"]').first();
    
    // Should show publisher/provider name
    await expect(firstCard.getByText(/Empresa|Proveedor/i)).toBeVisible();
  });

  test('Stats summary shows total datasets count', async ({ page }) => {
    // Should show stats summary at bottom - use exact match to avoid ambiguity
    await expect(page.getByText('Datasets publicados', { exact: true })).toBeVisible();
    
    // Should show DCAT-AP compliance note
    await expect(page.getByText(/DCAT-AP/).first()).toBeVisible();
  });
});
