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
const componentName = process.argv[2];

// eslint-disable-next-line no-undef
const componentPath = process.argv[3] || "library"; // Default path is empty if not provided

const fullComponentPath = join(
    __dirname,
    "..",
    "src",
    componentPath,
    "components"
);

// Check if the project is TypeScript or JavaScript
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

// Set file extensions accordingly
const fileExtension = isTypeScriptProject ? "ts" : "js";

const componentExtension = isTypeScriptProject ? "tsx" : "jsx";

const indexPath = join(fullComponentPath, `index.${fileExtension}`);

if (!componentName) {
  console.error("Please provide a component name");
  console.info(
      "Usage: npm run create:component <component-name> <component-path>"
  );
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the components folder if it does not exist
if (!existsSync(fullComponentPath)) {
  mkdirSync(fullComponentPath, { recursive: true });
  console.log(`Created components folder at "${fullComponentPath}"`);
}

// Check if the component already exists
const componentFilePath = join(
    fullComponentPath,
    `${componentName}.${componentExtension}`
);

if (existsSync(componentFilePath)) {
  console.error(
      `Component "${componentName}" already exists at "${componentPath}".`
  );
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the new component file
const componentTemplate = `import React from 'react';

const ${capitalizeFirstLetter(componentName)} = () => {
  return (
    <div className={""}>
      <h1 className={""}>${capitalizeFirstLetter(componentName)} Component</h1>
    </div>
  );
};

export default ${capitalizeFirstLetter(componentName)};
`;

writeFileSync(componentFilePath, componentTemplate);
console.log(`Component "${componentName}" created at "${componentFilePath}"`);

// Check if the index file already exists
if (!existsSync(indexPath)) {
  // Create the index file if it doesn't exist
  writeFileSync(
      indexPath,
      `
     import ${capitalizeFirstLetter(componentName)} from "./${componentName}.${componentExtension}";
     
        export { ${capitalizeFirstLetter(componentName)} };
    `
  );
  console.log(
      `Created index.${fileExtension} at "${indexPath}" and added export for ${componentName}`
  );
}
