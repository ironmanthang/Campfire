import { spawn } from 'node:child_process';

const runCommand = (command, args, label) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', (err) => {
      console.error(`❌ [${label}] Error:`, err.message);
      reject(err);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        console.error(`❌ [${label}] Failed with exit code ${code}.`);
        reject(new Error(`Process ${label} exited with code ${code}`));
      }
    });
  });
};

async function runPrepush() {
  console.log('🚀 Running prepush checks...');
  const startTime = Date.now();

  try {
    // Phase 1: Run non-dependent checks in parallel
    console.log('\n--- Phase 1: Parallel Checks (Tests, Typecheck, i18n Check for Desktop & Mobile) ---');
    await Promise.all([
      runCommand('pnpm', ['--filter', '*', 'test'], 'Tests'),
      runCommand('pnpm', ['--filter', '*', 'typecheck'], 'Typecheck'),
      runCommand('pnpm', ['--filter', 'desktop', '--filter', 'mobile', 'i18n:check'], 'i18n Check'),
      runCommand('pnpm', ['--filter', 'desktop', '--filter', 'mobile', 'lint'], 'Oxlint Check'),
      runCommand('cargo', ['check', '--manifest-path', 'desktop/src-tauri/Cargo.toml'], 'Rust Cargo Check'),
    ]);


    // Phase 2: Run production builds sequentially once validation checks pass
    console.log('\n--- Phase 2: Production Builds ---');
    await runCommand('pnpm', ['--filter', '*', 'build'], 'Build');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 All prepush checks passed in ${duration}s!`);
    process.exit(0);
  } catch (err) {
    console.error('\n💥 Prepush failed! Fix the errors above before pushing.');
    process.exit(1);
  }
}

runPrepush();