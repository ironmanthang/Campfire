import { spawnSync } from 'node:child_process';

const checks = [
  ['pnpm', ['--filter', '*', 'test']],
  ['pnpm', ['--filter', '*', 'typecheck']],
  ['pnpm', ['--filter', '*', 'build']],
];

for (const [command, args] of checks) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}