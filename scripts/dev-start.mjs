import { execSync, spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';

const PORT = Number(process.env.PORT || 4100);
const require = createRequire(import.meta.url);

function parseListeningPids(output) {
  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes(`:${PORT}`) || !line.includes('LISTENING')) continue;
    const match = line.match(/\s(\d+)\s*$/);
    if (match) {
      pids.add(Number(match[1]));
    }
  }
  return [...pids];
}

function stopPortOwner() {
  try {
    const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
    const pids = parseListeningPids(output).filter((pid) => Number.isFinite(pid) && pid > 0);

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      } catch {
        // If the process already exited, keep going.
      }
    }
  } catch {
    // Port is free or netstat had nothing to report.
  }
}

stopPortOwner();
rmSync('.next', { recursive: true, force: true });

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'dev', '--webpack', '-p', String(PORT)], {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
