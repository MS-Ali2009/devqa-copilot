import fs from 'fs';
import path from 'path';

/**
 * Loads .env and .env.local variables into process.env without external dependencies.
 */
export function loadEnvironment(cwd: string = process.cwd()): void {
  // Use Node.js built-in process.loadEnvFile if available (Node >= 20.6)
  const envFiles = ['.env', '.env.local'];

  for (const file of envFiles) {
    const fullPath = path.resolve(cwd, file);
    if (!fs.existsSync(fullPath)) continue;

    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(fullPath);
      } else {
        // Fallback manual parser
        parseEnvFile(fullPath);
      }
    } catch {
      // Fallback to manual parser on parse error
      parseEnvFile(fullPath);
    }
  }
}

function parseEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;

      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();

      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Do not overwrite existing env vars
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore read errors
  }
}
