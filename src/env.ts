import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export function loadRuntimeEnv(): NodeJS.ProcessEnv {
  const envFiles = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile, override: false });
    }
  }

  return process.env;
}
