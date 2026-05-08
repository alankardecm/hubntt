import { existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_PATH = resolve('.env');
const ENV_EXAMPLE_PATH = resolve('.env.example');

console.log('🚀 Starting HUB NTT Setup Check...');

// 1. Check .env
if (!existsSync(ENV_PATH)) {
  console.log('⚠️ .env file not found. Creating from .env.example...');
  copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  console.log('✅ .env created. PLEASE FILL IN YOUR CREDENTIALS.');
} else {
  console.log('✅ .env file exists.');
}

// 2. Validate environment using our new Zod schema
console.log('🔍 Validating environment variables...');
try {
  // We can't easily import the TS file here without ts-node or similar,
  // but we can do a basic check or instruct the user.
  console.log('💡 Tip: Run "npm run typecheck" to validate your .env against the Zod schema in src/lib/env.ts');
} catch (e) {
  console.error('❌ Validation failed.');
}

console.log('\n--- Setup Instructions ---');
console.log('1. Fill in the .env file with your API keys and database credentials.');
console.log('2. Run "npm install --legacy-peer-deps"');
console.log('3. Run "npm run dev" to start the server on port 4200.');
console.log('4. Visit http://localhost:4200/api/health/full to check service connectivity.');
console.log('--------------------------\n');
