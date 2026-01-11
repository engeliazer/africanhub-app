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

// Get page name and path from the arguments
// eslint-disable-next-line no-undef
const pageName = process.argv[2];

// eslint-disable-next-line no-undef
const pagePath = process.argv[3] || ""; // Default to empty string if no path provided

if (!pageName) {
  console.error("Please provide a page name");
  console.info("Usage: npm run create:page <page-name> <page-path>");
  // eslint-disable-next-line no-undef
  process.exit(1);
}

const fullPagePath = join(__dirname, "..", "src", pagePath, "pages", pageName);

// Check if the project is TypeScript or JavaScript
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

const fileExtension = isTypeScriptProject ? "tsx" : "jsx";

// Define the supporting subfolders to be created
const subfolders = ["components", "hooks", "containers"];

// Create the page folder if it doesn't exist
if (!existsSync(fullPagePath)) {
  mkdirSync(fullPagePath, { recursive: true });
  console.log(`Created page folder at "${fullPagePath}"`);
}

// Create the subfolders inside the page
subfolders.forEach((folder) => {
  const folderPath = join(fullPagePath, folder);

  if (!existsSync(folderPath)) {
    mkdirSync(folderPath);
    console.log(`Created ${folder} folder at "${folderPath}"`);
  }
});

// Create the main page file (PageName.tsx or PageName.jsx)
const pageFilePath = join(fullPagePath, `page.${fileExtension}`);

const pageTemplate = `
// Write Clean Code man. Love it or leave it
const ${capitalizeFirstLetter(pageName)}Page = () => {
  return (
    <div className={""}>
      <h1 className={""}>${pageName} Page</h1>
    </div>
  );
};

export default ${capitalizeFirstLetter(pageName)}Page;
`;

if (!existsSync(pageFilePath)) {
  writeFileSync(pageFilePath, pageTemplate);
  console.log(`Created page.${fileExtension} at "${pageFilePath}"`);
}

// Create an index.js or index.js file in the page folder for exporting
const indexFilePath = join(
    fullPagePath,
    `index.${fileExtension === "tsx" ? "ts" : "js"}`
);

if (!existsSync(indexFilePath)) {
  writeFileSync(
      indexFilePath,
      `export { default } from "./page.${fileExtension}";`
  );
  console.log(
      `Created index.${fileExtension === "tsx" ? "ts" : "js"} at "${indexFilePath}"`
  );
}
