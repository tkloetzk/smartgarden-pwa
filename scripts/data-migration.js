#!/usr/bin/env node

/**
 * Data Migration Script
 * 
 * A safe utility to inspect, validate, and migrate plant data
 * Run with: node scripts/data-migration.js [command]
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (you'll need to set up service account)
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
if (!serviceAccountPath) {
  console.error('Please set FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

const app = initializeApp({
  credential: credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

const commands = {
  inspect: inspectData,
  backup: createBackup,
  validate: validateData,
  migrate: migrateData,
  help: showHelp
};

async function main() {
  const command = process.argv[2] || 'help';
  const userUid = process.argv[3];
  
  if (!commands[command]) {
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
  
  if (command !== 'help' && !userUid) {
    console.error('Please provide user UID as second argument');
    console.error('Usage: node scripts/data-migration.js <command> <userUid>');
    process.exit(1);
  }
  
  try {
    await commands[command](userUid);
  } catch (error) {
    console.error('Migration script error:', error);
    process.exit(1);
  }
}

async function inspectData(userUid) {
  console.log('🔍 Inspecting plant data structure...\n');
  
  const plantsSnapshot = await db
    .collection('plants')
    .where('userId', '==', userUid)
    .get();
    
  const plants = plantsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`Found ${plants.length} plants for user: ${userUid}`);
  
  if (plants.length === 0) {
    console.log('No plants found. Nothing to inspect.');
    return;
  }
  
  // Show sample plant structure
  console.log('\n📋 Sample plant structure:');
  console.log(JSON.stringify(plants[0], null, 2));
  
  // Analyze field consistency
  console.log('\n📊 Field analysis across all plants:');
  const fieldAnalysis = analyzeFields(plants);
  console.table(fieldAnalysis);
  
  // Show basic validation
  const issues = validatePlantStructures(plants);
  if (issues.length > 0) {
    console.log('\n⚠️ Potential issues found:');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ No major structural issues found!');
  }
  
  // Show variety distribution
  console.log('\n🌱 Plant varieties:');
  const varieties = plants.reduce((acc, plant) => {
    const variety = plant.varietyName || 'Unknown';
    acc[variety] = (acc[variety] || 0) + 1;
    return acc;
  }, {});
  console.table(varieties);
}

async function createBackup(userUid) {
  console.log('💾 Creating data backup...\n');
  
  // Get all plants
  const plantsSnapshot = await db
    .collection('plants')
    .where('userId', '==', userUid)
    .get();
    
  const plants = plantsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Get all care activities
  const careSnapshot = await db
    .collection('careActivities')
    .where('userId', '==', userUid)
    .get();
    
  const careActivities = careSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  const backup = {
    version: '2024-08-07',
    timestamp: new Date().toISOString(),
    userUid,
    plants,
    careActivities,
    metadata: {
      plantCount: plants.length,
      careActivityCount: careActivities.length,
    }
  };
  
  // Save backup to file
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const filename = `backup-${userUid}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(backupDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
  
  console.log(`✅ Backup created: ${filepath}`);
  console.log(`📊 Backed up ${plants.length} plants and ${careActivities.length} care activities`);
}

async function validateData(userUid) {
  console.log('✅ Validating plant data structure...\n');
  
  const plantsSnapshot = await db
    .collection('plants')
    .where('userId', '==', userUid)
    .get();
    
  const plants = plantsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`Validating ${plants.length} plants...\n`);
  
  let validCount = 0;
  let issueCount = 0;
  const issues = [];
  
  plants.forEach((plant, index) => {
    const plantIssues = validateSinglePlant(plant);
    if (plantIssues.length === 0) {
      validCount++;
    } else {
      issueCount++;
      issues.push({
        plant: `${plant.varietyName || 'Unknown'} (${plant.id})`,
        issues: plantIssues
      });
    }
  });
  
  console.log(`📊 Validation Results:`);
  console.log(`✅ Valid plants: ${validCount}`);
  console.log(`⚠️ Plants with issues: ${issueCount}`);
  
  if (issues.length > 0) {
    console.log('\n📋 Detailed Issues:');
    issues.forEach(({ plant, issues: plantIssues }) => {
      console.log(`\n🌱 ${plant}:`);
      plantIssues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    });
  }
}

async function migrateData(userUid) {
  console.log('🚀 Starting data migration...\n');
  console.log('⚠️  WARNING: This will modify your production data!');
  console.log('Make sure you have created a backup first.\n');
  
  // Require explicit confirmation for production migration
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    readline.question('Type "YES" to continue with migration: ', resolve);
  });
  
  readline.close();
  
  if (answer !== 'YES') {
    console.log('Migration cancelled.');
    return;
  }
  
  // This is where you would implement the actual migration logic
  console.log('🔧 Migration logic would go here...');
  console.log('For safety, this script only provides inspection and validation.');
  console.log('Please implement specific migration logic based on your validation results.');
}

function validateSinglePlant(plant) {
  const issues = [];
  
  // Required fields
  if (!plant.id) issues.push('Missing id');
  if (!plant.varietyId) issues.push('Missing varietyId');
  if (!plant.varietyName) issues.push('Missing varietyName');
  if (!plant.plantedDate) issues.push('Missing plantedDate');
  if (!plant.location) issues.push('Missing location');
  if (!plant.container) issues.push('Missing container');
  if (typeof plant.isActive !== 'boolean') issues.push('Missing or invalid isActive');
  
  // Date validation
  if (plant.plantedDate) {
    const date = plant.plantedDate.toDate ? plant.plantedDate.toDate() : new Date(plant.plantedDate);
    if (isNaN(date.getTime())) {
      issues.push('Invalid plantedDate format');
    }
  }
  
  // Type validation
  if (plant.quantity && typeof plant.quantity !== 'number') {
    issues.push('quantity should be a number');
  }
  
  return issues;
}

function validatePlantStructures(plants) {
  const issues = [];
  
  if (plants.length === 0) return issues;
  
  // Check for consistent field structure
  const firstPlant = plants[0];
  const baseFields = Object.keys(firstPlant);
  
  plants.forEach((plant, index) => {
    const plantFields = Object.keys(plant);
    const missingFields = baseFields.filter(field => !plantFields.includes(field));
    const extraFields = plantFields.filter(field => !baseFields.includes(field));
    
    if (missingFields.length > 0) {
      issues.push(`Plant ${index} missing fields: ${missingFields.join(', ')}`);
    }
    if (extraFields.length > 0) {
      issues.push(`Plant ${index} has extra fields: ${extraFields.join(', ')}`);
    }
  });
  
  return issues;
}

function analyzeFields(plants) {
  const analysis = {};
  
  plants.forEach(plant => {
    Object.keys(plant).forEach(field => {
      if (!analysis[field]) {
        analysis[field] = {
          present: 0,
          missing: 0,
          types: new Set()
        };
      }
      
      if (plant[field] !== undefined && plant[field] !== null) {
        analysis[field].present++;
        analysis[field].types.add(typeof plant[field]);
      } else {
        analysis[field].missing++;
      }
    });
  });
  
  // Convert Sets to arrays for display
  Object.keys(analysis).forEach(field => {
    analysis[field].types = Array.from(analysis[field].types).join(', ');
  });
  
  return analysis;
}

function showHelp() {
  console.log(`
🌱 SmartGarden Data Migration Tool

Usage: node scripts/data-migration.js <command> <userUid>

Commands:
  inspect <userUid>  - Inspect current data structure
  backup <userUid>   - Create a backup of all data
  validate <userUid> - Validate data against current schema
  migrate <userUid>  - Run data migration (with confirmation)
  help               - Show this help message

Examples:
  node scripts/data-migration.js inspect abc123
  node scripts/data-migration.js backup abc123
  node scripts/data-migration.js validate abc123

Note: You need to set FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable
pointing to your Firebase service account key file.
`);
}

if (require.main === module) {
  main();
}