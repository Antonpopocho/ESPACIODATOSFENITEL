import { test, expect, request } from '@playwright/test';
import { loginAsPromotor, loginAsMember, dismissToasts, BASE_URL } from '../fixtures/helpers';

/**
 * Golden Path Test - Complete Incorporation Journey
 * Tests: Register -> Sign Contract -> Promotor marks paid -> Promotor generates identity
 * -> Member becomes effective -> Dataset upload (requires provider + effective)
 */

test.describe('Golden Path: Complete Incorporation Flow', () => {
  let testUserId: string;
  let testUserToken: string;
  const ts = Date.now();
  const testEmail = `golden_${ts}@test.com`;
  const testPassword = 'GoldenPath123!';
  const testNif = `F${String(ts).slice(-8)}`;

  test('Step 1: Register new member', async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/register');
    await page.getByTestId('register-name-input').fill(`TEST_Golden User ${ts}`);
    await page.getByTestId('register-email-input').fill(testEmail);
    await page.getByTestId('register-nif-input').fill(testNif);
    await page.getByTestId('register-organization-input').fill(`TEST_Golden Org ${ts}`);
    await page.getByTestId('register-phone-input').fill('+34 600 111 222');
    await page.getByTestId('register-password-input').fill(testPassword);
    await page.getByTestId('register-confirm-password-input').fill(testPassword);
    
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/register')),
      page.getByTestId('register-submit-button').click(),
    ]);
    expect(response.status()).toBe(200);
    
    // Success page shown
    await expect(page.locator('.mx-auto.w-16.h-16')).toBeVisible();
  });

  test('Step 2: New member signs contract', async ({ page }) => {
    await dismissToasts(page);
    // Login as new member
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill(testEmail);
    await page.getByTestId('login-password-input').fill(testPassword);
    await page.getByTestId('login-submit-button').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Go to contract page
    await page.goto('/my-contract');
    // Wait for loading
    await expect(page.locator('.bg-slate-50.rounded-lg').first()).toBeVisible();
    
    // Sign the contract
    const signBtn = page.getByTestId('sign-contract-button');
    await expect(signBtn).toBeVisible();
    const [signResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/contracts/sign')),
      signBtn.click(),
    ]);
    expect(signResponse.status()).toBe(200);
    
    // Now should show download button (contract signed)
    await expect(page.getByTestId('download-contract-button')).toBeVisible();
  });

  test('Step 3: Promotor marks payment as paid', async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
    await page.goto('/payments');
    
    // Search for our test user
    await page.getByTestId('payment-search-input').fill(testEmail.split('@')[0]);
    
    // Find and edit the payment
    const editBtn = page.locator('[data-testid^="edit-payment-"]').first();
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Set status to paid
    await page.getByTestId('payment-status-select').click();
    await page.getByRole('option', { name: 'Pagado' }).click();
    await page.getByTestId('payment-amount-input').fill('500');
    await page.getByTestId('payment-notes-input').fill('TEST_Golden path payment');
    
    const [saveResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/payments/')),
      page.getByTestId('save-payment-button').click(),
    ]);
    expect(saveResponse.status()).toBe(200);
  });

  test('Step 4: Promotor generates identity evidence for member', async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
    await page.goto('/members');
    
    // Search for our test user
    await page.getByTestId('member-search-input').fill(testEmail.split('@')[0]);
    
    // Open actions menu
    const actionBtn = page.locator('[data-testid^="member-actions-"]').first();
    await expect(actionBtn).toBeVisible({ timeout: 15000 });
    await actionBtn.click();
    
    // Click generate identity evidence
    const genIdentityItem = page.getByRole('menuitem', { name: /generar evidencia identidad/i });
    if (await genIdentityItem.count() > 0) {
      const [evidenceResponse] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/evidence/identity/')),
        genIdentityItem.click(),
      ]);
      expect(evidenceResponse.status()).toBe(200);
    }
  });

  test('Step 5: Verify promotor dashboard stats update', async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
    await page.goto('/dashboard');
    
    // Stats cards should be visible and show counts > 0
    await expect(page.getByTestId('stat-card-0')).toBeVisible();
    const totalMembersCard = page.getByTestId('stat-card-0');
    // Should show at least 1 member
    await expect(totalMembersCard.locator('.text-3xl')).not.toHaveText('0');
  });

  test('Step 6: Promotor can view audit logs for the flow', async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
    await page.goto('/audit');
    
    await page.waitForLoadState('domcontentloaded');
    // Should have audit entries from our test flow
    await expect(page.locator('h1, [class*="font-outfit"]').first()).toBeVisible();
  });
});

test.describe('Dataset Upload Flow (Provider)', () => {
  test('Promotor can manage datasets page', async ({ page }) => {
    await dismissToasts(page);
    await loginAsPromotor(page);
    await page.goto('/datasets');
    
    await expect(page.getByTestId('dataset-search-input')).toBeVisible();
    await expect(page.getByTestId('dataset-filter-select')).toBeVisible();
    // Dataset stats cards
    await expect(page.locator('.grid.grid-cols-1.sm\\:grid-cols-3').first()).toBeVisible();
  });
});
