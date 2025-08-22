// Simple script to regenerate tasks for existing strawberry plants
// This should be run once to fix the fertilization notification issue

// For now, this is a template. The actual regeneration should be done through the UI
// by editing plant details or we can create a button in the admin interface.

console.log(`
🍓 Strawberry Task Regeneration Script

To fix the fertilization notification issue for your existing strawberry plants:

1. Go to your plant detail page for each strawberry plant
2. Click "Edit Plant" 
3. Make any small change (like adding a note) and save
4. This will trigger task regeneration with the updated protocol

OR

Go to the browser console on your dashboard and run:

// Get user ID from Firebase Auth
const user = firebase.auth().currentUser;
if (user) {
  // This would call the regeneration method for all strawberry plants
  console.log('User ID:', user.uid);
  console.log('You can use this to manually regenerate tasks');
}

The fix is now in place for:
✅ New plants will automatically get fertilization tasks
✅ Existing plants can regenerate tasks by editing plant details
✅ Updated strawberry protocol with Neptune's Harvest + 9-15-30 schedule
`);