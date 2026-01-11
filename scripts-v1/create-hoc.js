import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line id-match
const __filename = fileURLToPath(import.meta.url);

// eslint-disable-next-line id-match
const __dirname = dirname(__filename);

// eslint-disable-next-line no-undef
const hocName = process.argv[2];

// eslint-disable-next-line no-undef
const hocPath = process.argv[3] || "library"; // Default path is empty if not provided

const hocFolder = join(__dirname, "..", "src", hocPath, "hoc");

// Check if it's a TypeScript project
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

// Set appropriate file extensions based on the project type
const fileExtension = isTypeScriptProject ? "ts" : "js";

const hocExtension = isTypeScriptProject ? "tsx" : "jsx";

const indexPath = join(hocFolder, `index.${fileExtension}`);

if (!hocName) {
  console.error("Please provide an hoc name");
  console.info("Usage: npm run create:hoc <hoc-name> <hoc-path>");
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the hoc folder if it does not exist
if(!existsSync(hocFolder)){
  mkdirSync(hocFolder, { recursive: true });
  console.log(`Created hoc folder at "${hocFolder}"`);
}

// Check if the hoc file already exists
const hocFilePath = join(hocFolder, `${hocName}.${hocExtension}`);

if(existsSync(hocFilePath)){
  console.error(`Hoc "${hocName}" already exists at "${hocFilePath}".`);
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// CREATE A NEW HOC FILE
const hocTemplate = `
import React from 'react';

const ${hocName} = (Component, extraProps) => {
    return function HOC(props) {
      const newProps = {
        ...props,
        ...extraProps
      };
      
      return <Component {...newProps} />;
    }
}

export default ${hocName};
`;

const hocTSXTemplate = `
import React from 'react';

const ${hocName} = (Component: React.ReactNode, extraProps: object) => {
    return function HOC(props: object) {
      const newProps = {
        ...props,
        ...extraProps
      };
      
      return <Component {...newProps} />;
    }
}

export default ${hocName};
`;

const template = isTypeScriptProject ? hocTSXTemplate : hocTemplate;

writeFileSync(hocFilePath, template);
console.log(`Hoc "${hocName}" created at "${hocFilePath}"`);

// Check if the index file already exists
if(!existsSync(indexPath)){
  // Create the index file if it doesn't exist
  writeFileSync(
    indexPath,
    `
    `
  );
  console.log(`Created index file at "${indexPath}"`);
}