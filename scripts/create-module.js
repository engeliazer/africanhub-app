import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line id-match
const __filename = fileURLToPath(import.meta.url);

// eslint-disable-next-line id-match
const __dirname = dirname(__filename);

// Get module name and path from the arguments
// eslint-disable-next-line no-undef
const moduleName = process.argv[2];

// eslint-disable-next-line no-undef
const modulePath = process.argv[3] || ""; // Default to empty string if no path provided

if (!moduleName) {
  console.error("Please provide a module name");
  console.info("Usage: npm run create:module <module-name> <module-path>");
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// CHECK IF MODULE NAME CONTAINS MODULE KEYWORD
if (moduleName.includes("Module") || moduleName.includes("module")) {
  console.error(
    "Module name should not contain the word 'Module'. Please provide a name without the word 'Module'."
  );
  // eslint-disable-next-line no-undef
  process.exit(1);
}

const fullModulePath = join(
  __dirname,
  "..",
  "src",
  "modules",
  modulePath,
  moduleName
);

// Define the subfolders to be created
const subfolders = [
  "pages",
  "components",
  "routes",
  "containers",
  "hooks",
];

// Create the module folder if it doesn't exist
if (!existsSync(fullModulePath)) {
  mkdirSync(fullModulePath, { recursive: true });
  console.log(`Created module folder at "${fullModulePath}"`);
}

// Create the subfolders inside the module
subfolders.forEach((folder) => {
  const folderPath = join(fullModulePath, folder);

  if (!existsSync(folderPath)) {
    mkdirSync(folderPath);
    console.log(`Created ${folder} folder at "${folderPath}"`);
  }
});

console.log(`Created ${moduleName} module at "${fullModulePath}"`);

