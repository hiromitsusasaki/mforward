#!/usr/bin/env node

import axios from 'axios';
import { Command } from 'commander';

type Json = Record<string, unknown>;

function getBaseUrl(): string {
  // mfapi's example server is http://localhost:3001/api
  return (process.env.MFAPI_BASE_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
}

function client() {
  const baseURL = getBaseUrl();
  return axios.create({
    baseURL,
    timeout: 30_000,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json'
    }
  });
}

async function main() {
  const program = new Command();

  program
    .name('mforward')
    .description('CLI client for mfapi (MoneyForward ME automation API)')
    .option('-j, --json', 'Output raw JSON')
    .option('--base-url <url>', 'Override base URL (or set MFAPI_BASE_URL env)');

  program.hook('preAction', (thisCmd) => {
    const opts = thisCmd.opts<{ baseUrl?: string }>();
    if (opts.baseUrl) process.env.MFAPI_BASE_URL = opts.baseUrl;
  });

  program
    .command('accounts')
    .description('List custom accounts')
    .action(async () => {
      const res = await client().get('/accounts');
      print(program, res.data);
    });

  const assets = program.command('assets').description('Manage assets under an account');

  assets
    .command('list')
    .description('List assets in an account')
    .argument('<accountString>', 'Account connection string (id@subAccountIdHash)')
    .action(async (accountString: string) => {
      const res = await client().get(`/accounts/${encodeURIComponent(accountString)}/assets`);
      print(program, res.data);
    });

  assets
    .command('create')
    .description('Create an asset in an account')
    .argument('<accountString>', 'Account connection string (id@subAccountIdHash)')
    .requiredOption('--subclass <id>', 'assetSubclassId (e.g. Cash, DomesticStock, InvestmentTrust, ...)')
    .requiredOption('--name <name>', 'Asset name')
    .requiredOption('--value <value>', 'Asset value (number)', (v) => Number(v))
    .option('--entriedPrice <price>', 'Entry price (number)', (v) => Number(v))
    .option('--entriedAt <yyyy/mm/dd>', 'Entry date as string')
    .option('--ensure', 'Enable ensure option (if server supports it)')
    .action(async (accountString: string, opts: any) => {
      const body: Json = {
        assetSubclassId: opts.subclass,
        name: opts.name,
        value: opts.value
      };
      if (opts.entriedPrice !== undefined) body.entriedPrice = opts.entriedPrice;
      if (opts.entriedAt !== undefined) body.entriedAt = opts.entriedAt;

      const res = await client().post(
        `/accounts/${encodeURIComponent(accountString)}/assets`,
        body,
        { params: opts.ensure ? { ensure: 'true' } : undefined }
      );
      print(program, { status: res.status, statusText: res.statusText });
    });

  assets
    .command('update')
    .description('Update an asset (assetSubclassId must remain the same as current)')
    .argument('<accountString>', 'Account connection string (id@subAccountIdHash)')
    .argument('<assetId>', 'Asset ID')
    .requiredOption('--subclass <id>', 'assetSubclassId (must match existing)')
    .requiredOption('--name <name>', 'Asset name')
    .requiredOption('--value <value>', 'Asset value (number)', (v) => Number(v))
    .option('--entriedPrice <price>', 'Entry price (number)', (v) => Number(v))
    .option('--entriedAt <yyyy/mm/dd>', 'Entry date as string')
    .option('--ensure', 'Enable ensure option (if server supports it)')
    .action(async (accountString: string, assetId: string, opts: any) => {
      const body: Json = {
        assetId,
        assetSubclassId: opts.subclass,
        name: opts.name,
        value: opts.value
      };
      if (opts.entriedPrice !== undefined) body.entriedPrice = opts.entriedPrice;
      if (opts.entriedAt !== undefined) body.entriedAt = opts.entriedAt;

      const res = await client().put(
        `/accounts/${encodeURIComponent(accountString)}/assets/${encodeURIComponent(assetId)}`,
        body,
        { params: opts.ensure ? { ensure: 'true' } : undefined }
      );
      print(program, { status: res.status, statusText: res.statusText });
    });

  assets
    .command('delete')
    .description('Delete an asset')
    .argument('<accountString>', 'Account connection string (id@subAccountIdHash)')
    .argument('<assetId>', 'Asset ID')
    .option('--ensure', 'Enable ensure option (if server supports it)')
    .action(async (accountString: string, assetId: string, opts: any) => {
      const res = await client().delete(
        `/accounts/${encodeURIComponent(accountString)}/assets/${encodeURIComponent(assetId)}`,
        { params: opts.ensure ? { ensure: 'true' } : undefined }
      );
      print(program, { status: res.status, statusText: res.statusText });
    });

  await program.parseAsync(process.argv);
}

function print(program: Command, data: unknown) {
  const opts = program.opts<{ json?: boolean }>();
  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  // pretty-ish default
  if (Array.isArray(data)) {
    console.table(data);
  } else {
    console.dir(data, { depth: null, colors: process.stdout.isTTY });
  }
}

main().catch((err) => {
  // Axios errors
  const status = err?.response?.status;
  const body = err?.response?.data;
  if (status) {
    console.error(`HTTP ${status}`);
    if (body) console.error(typeof body === 'string' ? body : JSON.stringify(body, null, 2));
  } else {
    console.error(err);
  }
  process.exit(1);
});
