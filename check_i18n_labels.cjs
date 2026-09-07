const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:5173/login');
  await page.getByLabel('Email').fill('admin@demo.com');
  await page.getByLabel('Mot de passe').fill('password123');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL('**/tableau-de-bord', { timeout: 15000 });

  // Invoices list - status label in French
  await page.goto('http://localhost:5173/factures');
  await page.waitForSelector('table');
  const frStatus = await page.locator('table tbody tr').first().locator('td').allTextContents();
  console.log('FR invoice row (fr):', frStatus.join(' | '));

  // Switch to English via LanguageSwitcher
  await page.getByRole('button', { name: /français|langue/i }).click().catch(() => {});
  // fallback: find select or button with language options
  const langButton = page.locator('[aria-label*="langue" i], [aria-label*="language" i], button:has-text("FR")').first();
  if (await langButton.count()) {
    await langButton.click();
    const enOption = page.getByText(/^English$/i);
    if (await enOption.count()) await enOption.click();
  }
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForSelector('table');
  const enStatus = await page.locator('table tbody tr').first().locator('td').allTextContents();
  console.log('Invoice row (after switch):', enStatus.join(' | '));

  console.log('Console/page errors:', errors.length ? errors : 'none');

  await browser.close();
})();
