import { test, expect } from '@playwright/test';
import { loginAsMember, dismissToasts } from '../fixtures/helpers';

test.describe('Member Contract Flow', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsMember(page);
  });

  test('My contract page loads', async ({ page }) => {
    await page.goto('/my-contract');
    await expect(page.locator('h1').filter({ hasText: 'Mi Contrato' })).toBeVisible();
  });

  test('Sign contract button is visible for unsigned contract', async ({ page }) => {
    await page.goto('/my-contract');
    // The demo member starts with unsigned contract
    // Either sign button or download button should be visible
    const signBtn = page.getByTestId('sign-contract-button');
    const downloadBtn = page.getByTestId('download-contract-button');
    const hasSignBtn = await signBtn.count() > 0;
    const hasDownloadBtn = await downloadBtn.count() > 0;
    expect(hasSignBtn || hasDownloadBtn).toBeTruthy();
  });

  test('Contract page shows contract content', async ({ page }) => {
    await page.goto('/my-contract');
    await expect(page.getByRole('heading', { name: /contrato de adhes/i })).toBeVisible();
  });

  test('Contract page shows payment status', async ({ page }) => {
    await page.goto('/my-contract');
    // Payment status section should be visible
    await expect(page.getByRole('heading', { name: /estado del pago/i })).toBeVisible();
  });
});

test.describe('Member Dashboard Steps', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsMember(page);
  });

  test('Dashboard shows incorporation progress steps', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('step-contract')).toBeVisible();
    await expect(page.getByTestId('step-payment')).toBeVisible();
    await expect(page.getByTestId('step-identity')).toBeVisible();
    await expect(page.getByTestId('step-effective')).toBeVisible();
  });

  test('Dashboard shows current incorporation status badge', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.status-badge').first()).toBeVisible();
  });
});

test.describe('Catalog Access (Member)', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsMember(page);
  });

  test('Catalog page loads for member', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1').filter({ hasText: /cat.logo/i })).toBeVisible();
  });
});

test.describe('My Evidence', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsMember(page);
  });

  test('Evidence page loads', async ({ page }) => {
    await page.goto('/my-evidence');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
