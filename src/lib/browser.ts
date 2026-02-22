import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type BrowserContext, type Page } from 'playwright';

export type BrowserOpts = {
  userDataDir: string;
  headless?: boolean;
};

export async function launchPersistent({ userDataDir, headless }: BrowserOpts): Promise<BrowserContext> {
  await fs.mkdir(userDataDir, { recursive: true });
  // Use installed Chrome if available
  return chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: headless ?? false,
    viewport: { width: 1400, height: 900 }
  });
}

export async function ensurePage(ctx: BrowserContext): Promise<Page> {
  const pages = ctx.pages();
  if (pages.length) return pages[0];
  return ctx.newPage();
}

export async function saveEvidence(page: Page, outDir: string, label: string) {
  await fs.mkdir(outDir, { recursive: true });
  const htmlPath = path.join(outDir, `${label}.html`);
  const pngPath = path.join(outDir, `${label}.png`);
  await fs.writeFile(htmlPath, await page.content(), 'utf8');
  await page.screenshot({ path: pngPath, fullPage: true });
  return { htmlPath, pngPath };
}

export async function looksLoggedOut(page: Page) {
  const url = page.url();
  if (/sign[_-]?in|login/i.test(url)) return true;

  // Heuristic: common login form fields
  const loginInput = await page.locator('input[type="password"], input[name*="password" i]').first();
  if (await loginInput.count()) {
    const visible = await loginInput.isVisible().catch(() => false);
    if (visible) return true;
  }

  return false;
}
