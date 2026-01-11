import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line id-match
const __filename = fileURLToPath(import.meta.url);

// eslint-disable-next-line id-match
const __dirname = dirname(__filename);

// eslint-disable-next-line no-undef
const hookName = process.argv[2];

// eslint-disable-next-line no-undef
const hookPath = process.argv[3] || "services"; // Default path is empty if not provided

const hooksFolder = join(__dirname, "..", "src", hookPath, "hooks");

// Check if it's a TypeScript project
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

// Set appropriate file extensions based on the project type
const fileExtension = isTypeScriptProject ? "ts" : "js";

const componentExtension = isTypeScriptProject ? "tsx" : "jsx";

const indexPath = join(hooksFolder, `index.${fileExtension}`);

if (!hookName) {
  console.error("Please provide a hook name");
  console.info("Usage: npm run create:hook <hook-name> <hook-path>");
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the hooks folder if it does not exist
if (!existsSync(hooksFolder)) {
  mkdirSync(hooksFolder, { recursive: true });
  console.log(`Created hooks folder at "${hooksFolder}"`);
}

// Check if the hook file already exists
const hookFilePath = join(hooksFolder, `${hookName}.${componentExtension}`);

if (existsSync(hookFilePath)) {
  console.error(`Hook "${hookName}" already exists at "${hookFilePath}".`);
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the new hook file
const hookTemplate = `import { useState, useEffect } from "react";

const ${hookName} = () => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Your effect here
  }, []);

  return state;
}

export default ${hookName};
`;

writeFileSync(hookFilePath, hookTemplate);
console.log(`Hook "${hookName}" created at "${hookFilePath}"`);

// Check if the index file already exists
if (!existsSync(indexPath)) {
  // Create the index file if it doesn't exist
  writeFileSync(
    indexPath,
    `
     import ${hookName} from "./${hookName}.${fileExtension}";\n
        export { ${hookName} };
    `
  );
  console.log(
    `Created index.${fileExtension} at "${indexPath}" and added export for ${hookName}`
  );
}
