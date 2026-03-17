import { test, expect } from '@playwright/test';

test('Homepage has correct title and play button', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ChessCash/);
  await expect(page.locator('text=Play Chess Online')).toBeVisible();
});

test('Play page renders Chessboard and Wallet', async ({ page }) => {
  await page.goto('/play');
  
  // Checking for some generic selectors we used
  await expect(page.getByText('Wallet Balance')).toBeVisible();
  
  // The chessboard should be in the DOM
  const board = page.locator('#BasicBoard');
  await expect(board).toBeVisible();
});

test('Sidebar navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Click on "Learn" in sidebar
  await page.locator('a[href="/learn"]').first().click();
  
  // Check that the AI GM Tutor text is visible
  await expect(page.locator('text=AI Grandmaster Tutor')).toBeVisible();
});
