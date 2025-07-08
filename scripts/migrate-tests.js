// scripts/migrate-tests.js
const fs = require("fs");
const path = require("path");

const migrations = [
  {
    // Replace old createMockPlant calls
    from: /const createMockPlant = \([\s\S]*?\n\};/g,
    to: "// Migrated to use centralized createMockPlant factory",
  },
  {
    // Replace old createMockVariety calls
    from: /const createMockVariety = \([\s\S]*?\n\};/g,
    to: "// Migrated to use centralized createMockVariety factory",
  },
  {
    // Add imports at the top of test files
    from: /import.*from.*'@testing-library\/react';/,
    to: `import { render, screen, waitFor } from '@testing-library/react';
import { createMockPlant, createMockVariety } from '../utils/testDataFactories';`,
  },
];

// Function to process a file
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let hasChanges = false;

  migrations.forEach((migration) => {
    if (migration.from.test(content)) {
      content = content.replace(migration.from, migration.to);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated: ${filePath}`);
  }
}

// Find and process all test files
function findTestFiles(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findTestFiles(fullPath);
    } else if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
      migrateFile(fullPath);
    }
  });
}

// Run migration
console.log("🚀 Starting test migration...");
findTestFiles("./src/__tests__");
console.log("✨ Migration complete!");
