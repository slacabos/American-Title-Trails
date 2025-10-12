#!/usr/bin/env node

// Script to sync markdown content between .md file and .ts file
// Usage: node scripts/sync-help-content.js [language]
// Example: node scripts/sync-help-content.js en

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get language from command line argument, default to 'en'
const language = process.argv[2] || "en";

const mdFile = path.join(__dirname, `../src/content/help/${language}.md`);
const tsFile = path.join(__dirname, `../src/content/help/${language}.ts`);

function syncContent() {
  try {
    // Check if the markdown file exists
    if (!fs.existsSync(mdFile)) {
      console.error(`❌ Markdown file not found: ${mdFile}`);
      console.log(
        `💡 Available languages: ${getAvailableLanguages().join(", ")}`
      );
      process.exit(1);
    }

    // Read the markdown file
    const markdownContent = fs.readFileSync(mdFile, "utf8");

    // Create the TypeScript content
    const tsContent = `// This file is auto-generated from ${language}.md
// To update the content, edit ${language}.md and run: npm run sync-help-content ${language}

export const helpContent = \`${markdownContent.replace(/`/g, "\\`")}\`;

export default { helpContent };
`;

    // Write the TypeScript file
    fs.writeFileSync(tsFile, tsContent);

    console.log("✅ Help content synced successfully!");
    console.log(`🌍 Language: ${language}`);
    console.log(`📄 Source: ${mdFile}`);
    console.log(`📦 Target: ${tsFile}`);
  } catch (error) {
    console.error("❌ Error syncing help content:", error.message);
    process.exit(1);
  }
}

function getAvailableLanguages() {
  const helpDir = path.join(__dirname, "../src/content/help");
  if (!fs.existsSync(helpDir)) return [];

  return fs
    .readdirSync(helpDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(".md", ""));
}

syncContent();
