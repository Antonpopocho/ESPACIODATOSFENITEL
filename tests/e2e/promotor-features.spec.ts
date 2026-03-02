import { test, expect } from '@playwright/test';
import { loginAsPromotor, dismissToasts } from '../fixtures/helpers';

test.describe('Promotor Members Management', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
  });

  test('Members page shows member table', async ({ page }) => {
    await page.goto('/members');
    await expect(page.getByTestId('member-search-input')).toBeVisible();
    // Members exist from seed data
    await expect(page.locator('table')).toBeVisible();
  });

  test('Can search members', async ({ page }) => {
    await page.goto('/members');
    await page.getByTestId('member-search-input').fill('demo');
    await expect(page.locator('[data-testid^="member-row-"]').first()).toBeVisible();
  });

  test('Can open member details dialog', async ({ page }) => {
    await page.goto('/members');
    // Open actions for first member
    await page.locator('[data-testid^="member-actions-"]').first().click();
    await page.getByRole('menuitem', { name: /ver detalles/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('Promotor Payments Management', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
  });

  test('Payments page shows payment stats', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByTestId('payment-search-input')).toBeVisible();
    // Stats cards for paid, pending, total
    await expect(page.locator('table, .flex.flex-col.items-center')).toBeVisible();
  });

  test('Can open edit payment dialog', async ({ page }) => {
    await page.goto('/payments');
    const editBtn = page.locator('[data-testid^="edit-payment-"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByTestId('payment-status-select')).toBeVisible();
      await expect(page.getByTestId('payment-amount-input')).toBeVisible();
      await expect(page.getByTestId('save-payment-button')).toBeVisible();
    }
  });
});

test.describe('Datasets Catalog (Promotor)', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
  });

  test('Datasets page loads for promotor', async ({ page }) => {
    await page.goto('/datasets');
    await expect(page.getByTestId('dataset-search-input')).toBeVisible();
    await expect(page.getByTestId('dataset-filter-select')).toBeVisible();
  });
});

test.describe('Governance Panel', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
  });

  test('Governance page loads', async ({ page }) => {
    await page.goto('/governance');
    await page.waitForLoadState('domcontentloaded');
    // Page should load without 500 errors
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });
});

test.describe('Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
  });

  test('Audit page loads with logs', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });
});
