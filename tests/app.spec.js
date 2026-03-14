const { test, expect } = require('@playwright/test');

const RSQUO = '\u2019'; // right single quotation mark used in "Roark's Space"

// Helper: clear localStorage and reload to get a fresh state
async function freshPage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);
}

// Helper: complete onboarding with optional name
async function completeOnboarding(page, name = '') {
  await page.waitForSelector('#onboarding-overlay', { state: 'visible' });
  if (name) await page.fill('#onboarding-name', name);
  await page.click('#onboarding-overlay .btn-workout-save');
  await page.waitForSelector('#onboarding-overlay', { state: 'hidden' });
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

test.describe('Onboarding', () => {
  test('shows onboarding on first load', async ({ page }) => {
    await freshPage(page);
    await expect(page.locator('#onboarding-overlay')).toBeVisible();
  });

  test('can complete onboarding without a name', async ({ page }) => {
    await freshPage(page);
    await page.click('#onboarding-overlay .btn-workout-save');
    await expect(page.locator('#onboarding-overlay')).toBeHidden();
    await expect(page.locator('#header-name')).toHaveText(`My${RSQUO}s Space`);
  });

  test('can complete onboarding with a name', async ({ page }) => {
    await freshPage(page);
    await completeOnboarding(page, 'Roark');
    await expect(page.locator('#header-name')).toHaveText(`Roark${RSQUO}s Space`);
  });

  test('skips onboarding on subsequent loads', async ({ page }) => {
    await freshPage(page);
    await completeOnboarding(page, 'Roark');
    await page.reload();
    await expect(page.locator('#onboarding-overlay')).toBeHidden();
  });
});

// ─── Daily tasks ──────────────────────────────────────────────────────────────

test.describe('Daily tasks', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await completeOnboarding(page);
  });

  test('can add a daily task', async ({ page }) => {
    await page.fill('#input-daily', 'Buy milk');
    await page.click('#quadrant-1 .btn-add');
    await expect(page.locator('#list-daily')).toContainText('Buy milk');
  });

  test('can complete a daily task', async ({ page }) => {
    await page.fill('#input-daily', 'Buy milk');
    await page.click('#quadrant-1 .btn-add');
    await page.locator('#list-daily .todo-item input[type="checkbox"]').first().check();
    await expect(page.locator('#list-daily .todo-text.done')).toContainText('Buy milk');
  });

  test('can delete a daily task', async ({ page }) => {
    await page.fill('#input-daily', 'Buy milk');
    await page.click('#quadrant-1 .btn-add');
    await page.locator('#list-daily .btn-delete').first().click();
    await expect(page.locator('#list-daily')).not.toContainText('Buy milk');
  });

  test('clear done removes completed tasks', async ({ page }) => {
    await page.fill('#input-daily', 'Buy milk');
    await page.click('#quadrant-1 .btn-add');
    await page.locator('#list-daily .todo-item input[type="checkbox"]').first().check();
    await page.click('#quadrant-1 .btn-clear');
    await expect(page.locator('#list-daily')).not.toContainText('Buy milk');
  });

  test('tasks persist after reload', async ({ page }) => {
    await page.fill('#input-daily', 'Persistent task');
    await page.click('#quadrant-1 .btn-add');
    await page.reload();
    await expect(page.locator('#list-daily')).toContainText('Persistent task');
  });
});

// ─── Goals ────────────────────────────────────────────────────────────────────

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await completeOnboarding(page);
  });

  test('can add a goal', async ({ page }) => {
    await page.fill('#input-longterm', 'Learn piano');
    await page.click('#quadrant-2 .btn-add');
    await expect(page.locator('#list-longterm')).toContainText('Learn piano');
  });

  test('goals persist after reload', async ({ page }) => {
    await page.fill('#input-longterm', 'Learn piano');
    await page.click('#quadrant-2 .btn-add');
    await page.reload();
    await expect(page.locator('#list-longterm')).toContainText('Learn piano');
  });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await completeOnboarding(page, 'Roark');
  });

  test('settings modal opens and closes', async ({ page }) => {
    await page.click('#settings-btn');
    await expect(page.locator('#settings-overlay')).toBeVisible();
    await page.click('#settings-overlay .btn-workout-skip');
    await expect(page.locator('#settings-overlay')).toBeHidden();
  });

  test('can change name in settings', async ({ page }) => {
    await page.click('#settings-btn');
    await page.fill('#settings-name', 'Alex');
    await page.click('#settings-overlay .btn-workout-save');
    await expect(page.locator('#header-name')).toHaveText(`Alex${RSQUO}s Space`);
  });

  test('can hide and show a quadrant', async ({ page }) => {
    await page.click('#settings-btn');
    await page.uncheck('#toggle-q2');
    await page.click('#settings-overlay .btn-workout-save');
    await expect(page.locator('#quadrant-2')).toBeHidden();

    await page.click('#settings-btn');
    await page.check('#toggle-q2');
    await page.click('#settings-overlay .btn-workout-save');
    await expect(page.locator('#quadrant-2')).toBeVisible();
  });

  test('hidden quadrant state persists after reload', async ({ page }) => {
    await page.click('#settings-btn');
    await page.uncheck('#toggle-q3');
    await page.click('#settings-overlay .btn-workout-save');
    await page.reload();
    await expect(page.locator('#quadrant-3')).toBeHidden();
  });

  test('hiding a quadrant does not clear its data', async ({ page }) => {
    await page.fill('#input-longterm', 'Learn piano');
    await page.click('#quadrant-2 .btn-add');

    await page.click('#settings-btn');
    await page.uncheck('#toggle-q2');
    await page.click('#settings-overlay .btn-workout-save');
    await expect(page.locator('#quadrant-2')).toBeHidden();

    await page.click('#settings-btn');
    await page.check('#toggle-q2');
    await page.click('#settings-overlay .btn-workout-save');
    await expect(page.locator('#list-longterm')).toContainText('Learn piano');
  });
});

// ─── Dark mode ────────────────────────────────────────────────────────────────

test.describe('Dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await completeOnboarding(page);
  });

  test('toggles dark mode on and off', async ({ page }) => {
    await page.click('#dark-toggle');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.click('#dark-toggle');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('dark mode persists after reload', async ({ page }) => {
    await page.click('#dark-toggle');
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

// ─── Weekend modal ────────────────────────────────────────────────────────────

test.describe('Weekend modal', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await completeOnboarding(page);
  });

  test('opens and closes weekend modal', async ({ page }) => {
    await page.click('#weekend-btn');
    await expect(page.locator('#weekend-overlay')).toBeVisible();
    await page.click('#weekend-overlay .workout-close');
    await expect(page.locator('#weekend-overlay')).toBeHidden();
  });

  test('can add a weekend task', async ({ page }) => {
    await page.click('#weekend-btn');
    await page.fill('#weekend-input-fri', 'Hike');
    await page.locator('#weekend-overlay form').first().locator('button[type="submit"]').click();
    await expect(page.locator('#weekend-list-fri')).toContainText('Hike');
  });
});

// ─── Header ───────────────────────────────────────────────────────────────────

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await completeOnboarding(page, 'Roark');
  });

  test('shows brand name', async ({ page }) => {
    await expect(page.locator('#header-name')).toContainText(`Roark${RSQUO}s Space`);
  });

  test('settings button is visible and clickable', async ({ page }) => {
    await expect(page.locator('#settings-btn')).toBeVisible();
    await page.click('#settings-btn');
    await expect(page.locator('#settings-overlay')).toBeVisible();
  });
});
