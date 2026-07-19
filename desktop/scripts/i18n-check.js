import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.resolve(__dirname, "../src/i18n/locales/en.json");
const viPath = path.resolve(__dirname, "../src/i18n/locales/vi.json");

if (!fs.existsSync(enPath)) {
  console.error(`❌ English locale file not found at: ${enPath}`);
  process.exit(1);
}
if (!fs.existsSync(viPath)) {
  console.error(`❌ Vietnamese locale file not found at: ${viPath}`);
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const vi = JSON.parse(fs.readFileSync(viPath, "utf8"));

let hasError = false;

function compareObjects(obj1, obj2, path1 = "", path2 = "") {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Check missing keys in obj2
  for (const key of keys1) {
    const currentPath = path1 ? `${path1}.${key}` : key;
    if (!(key in obj2)) {
      console.error(`❌ Key "${currentPath}" is present in en.json but missing in vi.json`);
      hasError = true;
    } else {
      const val1 = obj1[key];
      const val2 = obj2[key];
      const type1 = typeof val1;
      const type2 = typeof val2;

      if (type1 !== type2) {
        console.error(`❌ Type mismatch at "${currentPath}": en.json has type "${type1}" but vi.json has type "${type2}"`);
        hasError = true;
      } else if (type1 === "object" && val1 !== null && val2 !== null) {
        compareObjects(val1, val2, currentPath, currentPath);
      }
    }
  }

  // Check extra keys in obj2
  for (const key of keys2) {
    const currentPath = path2 ? `${path2}.${key}` : key;
    if (!(key in obj1)) {
      console.warn(`⚠️ Key "${currentPath}" is present in vi.json but missing in en.json (extra key)`);
      hasError = true;
    }
  }
}

console.log("Comparing en.json and vi.json keys...");
compareObjects(en, vi);

if (hasError) {
  console.error("\n❌ i18n translation key consistency check failed.");
  process.exit(1);
} else {
  console.log("\n✅ All translation keys are fully synchronized and matched successfully!");
  process.exit(0);
}
