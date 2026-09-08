import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function parseDotEnv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

let loaded = false;

/** Load `.env` / `.env.local` into process.env without overriding non-empty values. */
export function loadAppEnv() {
  if (loaded) return;
  loaded = true;
  const cwd = process.cwd();
  for (const name of ['.env', '.env.local']) {
    const filePath = resolve(cwd, name);
    if (!existsSync(filePath)) continue;
    for (const [key, value] of Object.entries(parseDotEnv(readFileSync(filePath, 'utf8')))) {
      if (!String(process.env[key] ?? '').trim()) {
        process.env[key] = value;
      }
    }
  }
}

export function env(name: string): string {
  loadAppEnv();
  return String(process.env[name] ?? '').trim();
}

loadAppEnv();
