import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: node scripts/bump-version.mjs <new-version | patch | minor | major>');
  console.error('Example: pnpm version:bump 0.1.7');
  console.error('Example: pnpm version:bump patch');
  process.exit(1);
}

const rootPkgPath = path.join(rootDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const currentVersion = rootPkg.version || '0.1.0';

let newVersion = arg;

if (['patch', 'minor', 'major'].includes(arg)) {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    console.error(`Cannot auto-increment invalid semver '${currentVersion}'.`);
    process.exit(1);
  }
  let [major, minor, patch] = parts;
  if (arg === 'patch') patch++;
  if (arg === 'minor') { minor++; patch = 0; }
  if (arg === 'major') { major++; minor = 0; patch = 0; }
  newVersion = `${major}.${minor}.${patch}`;
}

if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(newVersion)) {
  console.error(`Invalid version format: '${newVersion}'. Expected format like '0.1.7'.`);
  process.exit(1);
}

console.log(`Bumping version: ${currentVersion} -> ${newVersion}\n`);

const jsonFiles = [
  'package.json',
  'core/package.json',
  'desktop/package.json',
  'mobile/package.json',
  'desktop/src-tauri/tauri.conf.json',
];

for (const relPath of jsonFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const json = JSON.parse(raw);
    const oldV = json.version;
    json.version = newVersion;
    fs.writeFileSync(fullPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`  ✓ Updated ${relPath} (${oldV} -> ${newVersion})`);
  }
}

const cargoPath = path.join(rootDir, 'desktop/src-tauri/Cargo.toml');
if (fs.existsSync(cargoPath)) {
  let content = fs.readFileSync(cargoPath, 'utf8');
  const updatedContent = content.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`);
  fs.writeFileSync(cargoPath, updatedContent, 'utf8');
  console.log(`  ✓ Updated desktop/src-tauri/Cargo.toml -> ${newVersion}`);
}

console.log(`\n✨ Successfully bumped all files to v${newVersion}!`);
