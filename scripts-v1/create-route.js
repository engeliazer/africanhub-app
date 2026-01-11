import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line id-match
const __filename = fileURLToPath(import.meta.url);

// eslint-disable-next-line id-match
const __dirname = dirname(__filename);

// eslint-disable-next-line no-undef
const routeName = process.argv[2];

// eslint-disable-next-line no-undef
const routePath = process.argv[3] || "routes"; // Default path is "routes" if not provided

// Check if the project is TypeScript or JavaScript
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

// Set file extensions accordingly
const fileExtension = isTypeScriptProject ? "ts" : "js";

const routeExtension = isTypeScriptProject ? "tsx" : "jsx";

const fullRoutePath = join(__dirname, "..", "src", routePath);

const indexPath = join(fullRoutePath, `index.${fileExtension}`);

if (!routeName) {
  console.error("Please provide a route name");
  console.info("Usage: npm run create:route <route-name> <route-path>");
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the routes folder if it does not exist
if (!existsSync(fullRoutePath)) {
  mkdirSync(fullRoutePath, { recursive: true });
  console.log(`Created routes folder at "${fullRoutePath}"`);
}

// Check if the route already exists
const routeFilePath = join(fullRoutePath, `${routeName}.${routeExtension}`);

if (existsSync(routeFilePath)) {
  console.error(`Route "${routeName}" already exists at "${routeFilePath}".`);
  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Create the new route file
 const routeTemplate = `import React from 'react';
  export const ${routeName} = [
     {
        path:"",
        element: "",
        children: []
     }
  ]
`;

writeFileSync(routeFilePath, routeTemplate);
console.log(`Route "${routeName}" created at "${routeFilePath}"`);

// Update the index file
// Check if the index file already exists
if (!existsSync(indexPath)) {
  // Create the index file if it doesn't exist
  writeFileSync(
    indexPath,
    `
    //    Import and Export all routes here
    `
  );

}