#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Command } from 'commander';
import { defaultDataDir, defaultUserDataDir, tsLabel } from './lib/paths.js';
import { launchPersistent, ensurePage, saveEvidence, looksLoggedOut } from './lib/browser.js';
import { notify } from './lib/notify.js';

async function waitForEnter(message = 'Press Enter to continue...') {
  process.stdout.write(`\n${message}\n`);
  return new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => resolve());
  });
}

async function main() {
  const program = new Command();

  program
    .name('mforward')
    .description('MoneyForward ME helper: browser automation (manual login -> session reuse)')
    .option('--user-data-dir <dir>', 'Playwright persistent profile dir', defaultUserDataDir())
    .option('--data-dir <dir>', 'Output data dir', defaultDataDir());

  program
    .command('open')
    .description('Open Chrome with a dedicated persistent profile for manual login')
    .option('--url <url>', 'Start URL', 'https://moneyforward.com/')
    .action(async (opts) => {
      const { userDataDir } = program.opts<{ userDataDir: string }>();
      const ctx = await launchPersistent({ userDataDir, headless: false });
      const page = await ensurePage(ctx);
      await page.goto(opts.url, { waitUntil: 'domcontentloaded' });
      await waitForEnter('Log in if needed, then press Enter here to close the browser.');
      await ctx.close();
    });

  const fetchCmd = program.command('fetch').description('Fetch and export data by navigating pages');

  fetchCmd
    .command('page')
    .description('Fetch a page and save HTML + screenshot as evidence (starting point for parsers)')
    .requiredOption('--url <url>', 'Target URL (e.g. transactions page)')
    .option('--headless', 'Run headless (default false)', false)
    .action(async (opts) => {
      const { userDataDir, dataDir } = program.opts<{ userDataDir: string; dataDir: string }>();
      const ctx = await launchPersistent({ userDataDir, headless: !!opts.headless });
      const page = await ensurePage(ctx);

      await page.goto(opts.url, { waitUntil: 'domcontentloaded' });

      if (await looksLoggedOut(page)) {
        const msg = `ログインが必要そうです（セッション切れ/ログイン画面判定）。\n` +
          `1) mforward open --url '${opts.url}' でChromeを開きログイン\n` +
          `2) その後もう一度 mforward fetch page --url '${opts.url}' を実行\n`;

        await notify({
          title: 'MoneyForward: 要ログイン',
          body: msg
        }).catch((e) => {
          console.error('notify failed:', e);
        });

        await ctx.close();
        process.exitCode = 2;
        return;
      }

      const label = tsLabel();
      const outRaw = path.join(dataDir, 'raw');
      const evidence = await saveEvidence(page, outRaw, label);

      // Also store minimal metadata
      const meta = {
        fetchedAt: new Date().toISOString(),
        url: page.url(),
        title: await page.title().catch(() => null),
        htmlPath: evidence.htmlPath,
        pngPath: evidence.pngPath
      };
      await fs.mkdir(outRaw, { recursive: true });
      await fs.writeFile(path.join(outRaw, `${label}.meta.json`), JSON.stringify(meta, null, 2));

      console.log(JSON.stringify(meta, null, 2));
      await ctx.close();
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
