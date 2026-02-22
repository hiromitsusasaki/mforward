import os from 'node:os';
import path from 'node:path';

export function defaultUserDataDir() {
  return path.join(os.homedir(), '.config', 'mforward', 'chrome-profile');
}

export function defaultDataDir() {
  return path.join(process.cwd(), 'data');
}

export function tsLabel(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
