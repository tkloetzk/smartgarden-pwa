// Debug script to check scheduled tasks in Firebase
// Run with: node debug-tasks.js

const admin = require('firebase-admin');

// Initialize Firebase Admin with your credentials
// You'll need to provide your Firebase service account key
const serviceAccount = {
  // Add your Firebase service account key here
  // For security, you should use environment variables
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function debugScheduledTasks() {
  try {
    console.log('🔍 Checking scheduled tasks collection...');
    
    const tasksSnapshot = await db.collection('scheduledTasks').get();
    
    console.log(`📊 Found ${tasksSnapshot.size} total scheduled tasks`);
    
    const strawberryTasks = [];
    
    tasksSnapshot.forEach(doc => {
      const task = doc.data();
      
      // Look for strawberry-related tasks
      if (task.plantId && (
        task.taskName?.toLowerCase().includes('strawberry') ||
        task.varietyName?.toLowerCase().includes('strawberry') ||
        task.varietyName?.toLowerCase().includes('albion')
      )) {
        strawberryTasks.push({
          id: doc.id,
          ...task,
          dueDate: task.dueDate?.toDate?.() || task.dueDate
        });
      }
    });
    
    console.log(`🍓 Found ${strawberryTasks.length} strawberry-related tasks`);
    
    // Group by plant ID and task type
    const tasksByPlant = {};
    strawberryTasks.forEach(task => {
      if (!tasksByPlant[task.plantId]) {
        tasksByPlant[task.plantId] = {};
      }
      if (!tasksByPlant[task.plantId][task.taskType]) {
        tasksByPlant[task.plantId][task.taskType] = [];
      }
      tasksByPlant[task.plantId][task.taskType].push(task);
    });
    
    // Show tasks by plant
    Object.keys(tasksByPlant).forEach(plantId => {
      console.log(`\n🌱 Plant ID: ${plantId}`);
      
      Object.keys(tasksByPlant[plantId]).forEach(taskType => {
        const tasks = tasksByPlant[plantId][taskType];
        console.log(`  📋 ${taskType} tasks (${tasks.length}):`);
        
        tasks.forEach(task => {
          console.log(`    - ${task.taskName}`);
          console.log(`      Due: ${task.dueDate}`);
          console.log(`      Product: ${task.details?.product || 'N/A'}`);
          console.log(`      Created: ${task.createdAt?.toDate?.() || task.createdAt}`);
        });
      });
    });
    
    // Check for overdue fertilization tasks
    const now = new Date();
    const overdueFertTasks = strawberryTasks.filter(task => 
      task.taskType === 'fertilize' && 
      new Date(task.dueDate) < now
    );
    
    console.log(`\n⚠️  Found ${overdueFertTasks.length} overdue fertilization tasks`);
    overdueFertTasks.forEach(task => {
      const daysOverdue = Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
      console.log(`  - ${task.taskName} (${daysOverdue} days overdue)`);
      console.log(`    Plant: ${task.plantId}`);
      console.log(`    Product: ${task.details?.product}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking tasks:', error);
  }
}

async function debugPlants() {
  try {
    console.log('\n🌿 Checking plants collection...');
    
    const plantsSnapshot = await db.collection('plants').get();
    
    console.log(`📊 Found ${plantsSnapshot.size} total plants`);
    
    const strawberryPlants = [];
    
    plantsSnapshot.forEach(doc => {
      const plant = doc.data();
      
      if (plant.varietyName?.toLowerCase().includes('strawberry') ||
          plant.varietyName?.toLowerCase().includes('albion')) {
        strawberryPlants.push({
          id: doc.id,
          ...plant,
          plantedDate: plant.plantedDate?.toDate?.() || plant.plantedDate
        });
      }
    });
    
    console.log(`🍓 Found ${strawberryPlants.length} strawberry plants`);
    
    strawberryPlants.forEach(plant => {
      const daysSincePlanting = Math.floor((new Date() - new Date(plant.plantedDate)) / (1000 * 60 * 60 * 24));
      console.log(`\n🌱 ${plant.customName || plant.varietyName}`);
      console.log(`  ID: ${plant.id}`);
      console.log(`  Planted: ${plant.plantedDate} (${daysSincePlanting} days ago)`);
      console.log(`  Variety: ${plant.varietyName}`);
      console.log(`  User: ${plant.userId}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking plants:', error);
  }
}

async function main() {
  await debugPlants();
  await debugScheduledTasks();
  
  // Gracefully exit
  process.exit(0);
}

main().catch(console.error);