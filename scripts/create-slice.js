import {existsSync, mkdirSync, writeFileSync} from "fs";
import {join, dirname} from "path";
import {fileURLToPath} from "url";

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1) ;
};

// eslint-disable-next-line id-match
const __filename = fileURLToPath(import.meta.url);

// eslint-disable-next-line id-match
const __dirname = dirname(__filename);

// eslint-disable-next-line no-undef
const sliceName = process.argv[2];

// eslint-disable-next-line no-undef
const slicePath = process.argv[3] ?? "state" ; // Path is required for slices

if (!sliceName) {
    console.error("Please provide a slice name");
    console.info("Usage: npm run create:slice <slice-name> <slice-path>");
    // eslint-disable-next-line no-undef
    process.exit(1);
}

// CHECK IF SLICE NAME CONTAINS SLICE KEYWORD
if (sliceName.includes("Slice") || sliceName.includes("slice")) {
    console.error("Slice name should not contain the word 'Slice'. Please provide a name without the word 'Slice'.");
    // eslint-disable-next-line no-undef
    process.exit(1);
}

if(!slicePath){
    console.error("Please provide a slice path");
    console.info("Usage: npm run create:slice <slice-name> <slice-path>");
    // eslint-disable-next-line no-undef
    process.exit(1);
}

// Check if the project is TypeScript or JavaScript
const isTypeScriptProject = existsSync(join(__dirname, "..", "tsconfig.json"));

const fileExtension = isTypeScriptProject ? "ts" : "js";

// CREATE AN INDEX FILE FOR THE SLICES FOLDER IF NOT EXISTS
const slicesFolder = join(__dirname, "..", "src", slicePath);

const indexPath = join(slicesFolder, `index.${fileExtension}`);

if (!existsSync(slicesFolder)) {
    mkdirSync(slicesFolder, {recursive: true});
    console.log(`Created slices folder at "${slicesFolder}"`);
}

const fullSlicePath = join(slicesFolder, `${sliceName}.${fileExtension}x`);

// SLICE TEMPLATE
const sliceTemplate = `import {createSlice} from "@reduxjs/toolkit";
   
 const initialState = {
  status: "idle",
  data: null,
  error: null,
  }
  
  const ${capitalizeFirstLetter(sliceName)}Slice = createSlice({
    name: "${capitalizeFirstLetter(sliceName)}",
    initialState,
    reducers: {
      // Add reducers here
      onClear: (state) => {
        state.status = "idle";
        state.data = null;
        state.error = null;
      },
    }
  });
  
  export default ${capitalizeFirstLetter(sliceName)}Slice.reducer;
  export const {onClear} = ${capitalizeFirstLetter(sliceName)}Slice.actions;
`;

// CREATE THE SLICE IF IT DOES NOT EXIST
if (!existsSync(fullSlicePath)) {
  writeFileSync(fullSlicePath, sliceTemplate);
    console.log(`Created slice at "${fullSlicePath}"`);
}

if (!existsSync(indexPath)) {
    writeFileSync(indexPath, `export * from './${sliceName}';\n`);
    console.log(`Created index file at "${indexPath}"`);
}

