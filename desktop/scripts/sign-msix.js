import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  const msixDir = path.resolve('src-tauri/target/msix');
  if (!fs.existsSync(msixDir)) {
    console.log('No msix directory found, skipping signing.');
    process.exit(0);
  }

  const msixFiles = fs.readdirSync(msixDir).filter((f) => f.endsWith('.msix'));
  if (msixFiles.length === 0) {
    console.log('No .msix files found to sign.');
    process.exit(0);
  }

  // Find signtool.exe dynamically
  const sdkBase = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';
  let signtoolPath = '';
  if (fs.existsSync(sdkBase)) {
    const versions = fs.readdirSync(sdkBase);
    for (const ver of versions.reverse()) {
      const candidate = path.join(sdkBase, ver, 'x64', 'signtool.exe');
      if (fs.existsSync(candidate)) {
        signtoolPath = candidate;
        break;
      }
    }
  }

  if (!signtoolPath) {
    console.warn('signtool.exe not found on system. Skipping local dev signing.');
    process.exit(0);
  }

  for (const file of msixFiles) {
    const fullPath = path.join(msixDir, file);
    console.log(`Signing local dev MSIX: ${file}...`);
    execSync(`"${signtoolPath}" sign /fd SHA256 /n "2BC2645C-EFF7-406D-A427-7E47E89D2842" "${fullPath}"`, {
      stdio: 'inherit',
    });
  }
  console.log('✅ Local MSIX signing completed.');
} catch (err) {
  console.error('Signing failed:', err.message);
}
