import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const appcertPath = 'C:\\Program Files (x86)\\Windows Kits\\10\\App Certification Kit\\appcert.exe';
const msixDir = path.resolve('src-tauri/target/msix');

if (!fs.existsSync(appcertPath) || !fs.existsSync(msixDir)) {
  console.log('Skipping WACK test: appcert.exe or msix output directory missing.');
  process.exit(0);
}

// Find latest .msixbundle (preferred) or .msix file
const files = fs.readdirSync(msixDir).map((f) => ({
  name: f,
  mtime: fs.statSync(path.join(msixDir, f)).mtimeMs,
}));

const bundleFile = files.filter((f) => f.name.endsWith('.msixbundle')).sort((a, b) => b.mtime - a.mtime)[0]?.name;
const msixFile = files.filter((f) => f.name.endsWith('.msix')).sort((a, b) => b.mtime - a.mtime)[0]?.name;
const targetFile = bundleFile || msixFile;

if (!targetFile) {
  console.log('No .msix or .msixbundle files found for WACK test.');
  process.exit(0);
}

const packagePath = path.join(msixDir, targetFile);
const reportPath = path.join(msixDir, 'WACK_Report.xml');

// Remove old report so we never read a stale result
if (fs.existsSync(reportPath)) {
  try {
    fs.unlinkSync(reportPath);
  } catch {}
}

console.log(`\n🔍 Running WACK test on: ${targetFile}...`);

try {
  execSync(`"${appcertPath}" test -appxpackagepath "${packagePath}" -reportoutputpath "${reportPath}"`, {
    stdio: 'inherit',
  });
} catch {}


if (fs.existsSync(reportPath)) {
  const match = fs.readFileSync(reportPath, 'utf8').match(/OVERALL_RESULT="([^"]+)"/);
  const result = match ? match[1] : 'UNKNOWN';
  console.log(result === 'PASS' ? '\n✅ WACK Test: PASS' : `\n⚠️ WACK Test: ${result}\nReport: ${reportPath}`);
} else {
  console.warn('\n⚠️ WACK test failed to generate a report file.');
}
