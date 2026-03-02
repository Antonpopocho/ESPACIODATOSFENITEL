import { test, expect } from '@playwright/test';
import { loginAsPromotor, loginAsMember, dismissToasts } from '../fixtures/helpers';

test.describe('Core Auth Flows', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-button')).toBeVisible();
    await expect(page.getByTestId('register-link')).toBeVisible();
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('notexist@invalid.com');
    await page.getByTestId('login-password-input').fill('WrongPass123!');
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/login')),
      page.getByTestId('login-submit-button').click(),
    ]);
    expect(response.status()).toBe(401);
    await expect(page.getByTestId('login-error')).toBeVisible();
  });

  test('Promotor login navigates to dashboard', async ({ page }) => {
    await loginAsPromotor(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Member login navigates to dashboard', async ({ page }) => {
    await loginAsMember(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByTestId('register-name-input')).toBeVisible();
    await expect(page.getByTestId('register-email-input')).toBeVisible();
    await expect(page.getByTestId('register-nif-input')).toBeVisible();
    await expect(page.getByTestId('register-organization-input')).toBeVisible();
    await expect(page.getByTestId('register-password-input')).toBeVisible();
    await expect(page.getByTestId('register-confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('register-submit-button')).toBeVisible();
  });

  test('Register with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/register');
    await page.getByTestId('register-name-input').fill('Test User');
    await page.getByTestId('register-email-input').fill('newuser@test.com');
    await page.getByTestId('register-nif-input').fill('A12345678');
    await page.getByTestId('register-organization-input').fill('Test Org');
    await page.getByTestId('register-password-input').fill('TestPass123!');
    await page.getByTestId('register-confirm-password-input').fill('DifferentPass123!');
    await page.getByTestId('register-submit-button').click();
    await expect(page.getByTestId('register-error')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('Promotor dashboard shows stat cards', async ({ page }) => {
    await loginAsPromotor(page);
    await expect(page.getByTestId('stat-card-0')).toBeVisible();
    await expect(page.getByTestId('stat-card-1')).toBeVisible();
    await expect(page.getByTestId('quick-action-members')).toBeVisible();
    await expect(page.getByTestId('quick-action-payments')).toBeVisible();
  });

  test('Member dashboard shows incorporation steps', async ({ page }) => {
    await loginAsMember(page);
    await expect(page.getByTestId('step-contract')).toBeVisible();
    await expect(page.getByTestId('step-payment')).toBeVisible();
    await expect(page.getByTestId('step-identity')).toBeVisible();
    await expect(page.getByTestId('step-effective')).toBeVisible();
  });

  test('Promotor can navigate to Members page', async ({ page }) => {
    await loginAsPromotor(page);
    await page.getByTestId('quick-action-members').click();
    await expect(page).toHaveURL(/\/members/);
    await expect(page.getByTestId('member-search-input')).toBeVisible();
  });

  test('Promotor can navigate to Payments page', async ({ page }) => {
    await loginAsPromotor(page);
    await page.getByTestId('quick-action-payments').click();
    await expect(page).toHaveURL(/\/payments/);
    await expect(page.getByTestId('payment-search-input')).toBeVisible();
  });

  test('Member cannot access promotor-only pages', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/members');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
