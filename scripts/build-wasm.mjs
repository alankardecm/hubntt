import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
const wasmDir = path.join(process.cwd(), 'node_modules', '@next', 'swc-wasm-nodejs');
const port = String(process.env.PORT || 4100);
const env = {
  ...process.env,
  PORT: port,
  NEXT_TEST_WASM: '1',
  NEXT_TEST_WASM_DIR: wasmDir,
};

const child =
  process.platform === 'win32'
    ? spawn(`npx -y node@20 "${nextBin}" build --webpack`, {
        stdio: 'inherit',
        shell: true,
        env,
      })
    : spawn('npx', ['-y', 'node@20', nextBin, 'build', '--webpack'], {
        stdio: 'inherit',
        shell: false,
        env,
      });

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
