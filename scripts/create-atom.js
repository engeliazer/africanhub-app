import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1) ;
};

// eslint-disable-next-line id-match
const __filename = fileURLToPath(import.meta.url);

// eslint-disable-next-line id-match
const __dirname = dirname(__filename);

// eslint-disable-next-line no-undef
const atomName = process.argv[2];

// eslint-disable-next-line no-undef
const atomPath = process.argv[3] || "library"; // Default path is empty if not provided

const atomsFolder = join(__dirname, "..", "src", atomPath, "atoms");

// Check if it's a TypeScript project
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

// Set appropriate file extensions based on the project type
const fileExtension = isTypeScriptProject ? "ts" : "js";

const componentExtension = isTypeScriptProject ? "tsx" : "jsx";

const indexPath = join(atomsFolder, `index.${fileExtension}`);

if (!atomName) {
  console.error("Please provide an atom name");
  console.info("Usage: npm run create:atom <atom-name> <atom-path>");
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the atoms folder if it does not exist
if (!existsSync(atomsFolder)) {
  mkdirSync(atomsFolder, { recursive: true });
  console.log(`Created atoms folder at "${atomsFolder}"`);
}

// Check if the atom file already exists
const atomFilePath = join(atomsFolder, `${atomName}.${componentExtension}`);

if (existsSync(atomFilePath)) {
  console.error(`Atom "${atomName}" already exists at "${atomFilePath}".`);
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the new atom file
const atomTemplate = `import React from 'react';

const ${capitalizeFirstLetter(atomName)} = () => {
    return (
        <div className={""}>
            <h1 className={""}>${capitalizeFirstLetter(atomName)} Atom</h1>
        </div>
    );
};

export default ${capitalizeFirstLetter(atomName)};`;

writeFileSync(atomFilePath, atomTemplate);
console.log(`Atom "${atomName}" created at "${atomFilePath}"`);

// Check if the index file already exists
if (!existsSync(indexPath)) {
  // Create the index file if it doesn't exist
  writeFileSync(
    indexPath,
    `
      import ${capitalizeFirstLetter(atomName)} from "./${atomName}.${componentExtension}";
      
      export { ${capitalizeFirstLetter(atomName)} };
    `
  );
  console.log(
    `Created index.${fileExtension} at "${indexPath}" and added export for ${atomName}`
  );
}
