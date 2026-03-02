import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://fenitel-datos.preview.emergentagent.com';

export const PROMOTOR_EMAIL = 'admin@fenitel.es';
export const PROMOTOR_PASSWORD = 'FenitelAdmin2025!';
export const MEMBER_EMAIL = 'empresa@demo.com';
export const MEMBER_PASSWORD = 'Demo123456!';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function loginAsPromotor(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(PROMOTOR_EMAIL);
  await page.getByTestId('login-password-input').fill(PROMOTOR_PASSWORD);
  await page.getByTestId('login-submit-button').click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginAsMember(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(MEMBER_EMAIL);
  await page.getByTestId('login-password-input').fill(MEMBER_PASSWORD);
  await page.getByTestId('login-submit-button').click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}
