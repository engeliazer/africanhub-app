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
const containerName = process.argv[2];

// eslint-disable-next-line no-undef
const containerPath = process.argv[3] || "library";

// Default path is empty if not provided
const fullContainerPath = join(
    __dirname,
    "..",
    "src",
    containerPath,
    "containers"
);

// Check if the project is TypeScript or JavaScript
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

// Set file extensions accordingly
const fileExtension = isTypeScriptProject ? "ts" : "js";

const containerExtension = isTypeScriptProject ? "tsx" : "jsx";

const indexPath = join(fullContainerPath, `index.${fileExtension}`);

if (!containerName) {
  console.error("Please provide a container name");
  console.info(
      "Usage: npm run create:container <container-name> <container-path>"
  );
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the containers folder if it does not exist
if (!existsSync(fullContainerPath)) {
  mkdirSync(fullContainerPath, { recursive: true });
  console.log(`Created containers folder at "${fullContainerPath}"`);
}

// Check if the container already exists
const containerFilePath = join(
    fullContainerPath,
    `${containerName}.${containerExtension}`
);

if (existsSync(containerFilePath)) {
  console.error(
      `Container "${containerName}" already exists at "${containerPath}".`
  );
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the new container file
const containerTemplate = `import React from 'react';

const ${capitalizeFirstLetter(containerName)} = () => {
  return (
    <div className={""}>
      <h1 className={""}>${capitalizeFirstLetter(containerName)} Container</h1>
    </div>
  );
};

export default ${capitalizeFirstLetter(containerName)};
`;

writeFileSync(containerFilePath, containerTemplate);
console.log(`Container "${containerName}" created at "${containerFilePath}"`);

// Check if the index file already exists
if (!existsSync(indexPath)) {
  // Create the index file if it doesn't exist
  writeFileSync(
      indexPath,
      `
import ${containerName} from "./${containerName}.${containerExtension}";

export { ${containerName} };
`
  );
  console.log(
      `Created index.${fileExtension} at "${indexPath}" and added export for ${containerName}`
  );
}
