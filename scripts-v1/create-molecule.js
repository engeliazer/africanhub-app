import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// eslint-disable-next-line id-match
const __filename = fileURLToPath(import.meta.url);

// eslint-disable-next-line id-match
const __dirname = dirname(__filename);

// eslint-disable-next-line no-undef
const moleculeName = process.argv[2];

// eslint-disable-next-line no-undef
const moleculePath = process.argv[3] || "library"; // Default to empty string if no path provided

const fullMoleculePath = join(
    __dirname,
    "..",
    "src",
    moleculePath,
    "molecules"
);

// Check if the project is TypeScript or JavaScript
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

const fileExtension = isTypeScriptProject ? "ts" : "js";

const moleculeExtension = isTypeScriptProject ? "tsx" : "jsx";

const indexPath = join(fullMoleculePath, `index.${fileExtension}`);

if (!moleculeName) {
  console.error("Please provide a molecule name");
  console.info(
      "Usage: npm run create:molecule <molecule-name> <molecule-path>"
  );
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the molecules folder if it doesn't exist
if (!existsSync(fullMoleculePath)) {
  mkdirSync(fullMoleculePath, { recursive: true });
  console.log(`Created molecules folder at "${fullMoleculePath}"`);
}

// Check if the molecule already exists
const moleculeFilePath = join(
    fullMoleculePath,
    `${moleculeName}.${moleculeExtension}`
);

if (existsSync(moleculeFilePath)) {
  console.error(
      `Molecule "${moleculeName}" already exists at "${moleculePath}".`
  );
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the new molecule file
const moleculeTemplate = `import React from 'react';

const ${capitalizeFirstLetter(moleculeName)} = () => {
  return (
    <div className={""}>
      <h1 className={""}>${capitalizeFirstLetter(moleculeName)} Molecule</h1>
    </div>
  );
};

export default ${capitalizeFirstLetter(moleculeName)};
`;

writeFileSync(moleculeFilePath, moleculeTemplate);
console.log(`Molecule "${moleculeName}" created at "${moleculeFilePath}"`);

// Check if the index file already exists
if (!existsSync(indexPath)) {
  // Create the index file if it doesn't exist
  writeFileSync(
      indexPath,
      `
import ${moleculeName} from "./${moleculeName}.${moleculeExtension}";

export { ${moleculeName} };
`
  );
  console.log(
      `Created index.${fileExtension} at "${indexPath}" and added export for ${moleculeName}`
  );
}
