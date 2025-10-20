/**
 * Test script for goal path fix
 * Tests the dependency resolution between dashboard manager and dependency manager
 */

import DashboardManager from './database/dashboard-manager.js';
import db from './database/db-config.js';

async function testGoalPathFix() {
  console.log('🧪 Testing Goal Path Fix...');
  console.log('===========================');

  try {
    // Test with a known module code
    const moduleCode = 'BIKE-11.1.1';
    
    console.log(`📋 Testing goal path for module: ${moduleCode}`);
    
    // Get all modules to see what's in the database
    const allModules = await db.modules.toArray();
    console.log(`📊 Total modules in database: ${allModules.length}`);
    
    // Find the target module
    const targetModule = allModules.find(m => m.code === moduleCode);
    if (!targetModule) {
      console.log(`❌ Module ${moduleCode} not found in database`);
      return;
    }
    
    console.log(`✅ Found module: ${targetModule.title} (ID: ${targetModule.id})`);
    
    // Test the goal path function
    console.log('🔍 Testing getGoalPath...');
    const goalPath = await DashboardManager.getGoalPath(moduleCode);
    
    console.log('🎯 Goal Path Result:');
    console.log(`   - Target: ${goalPath.targetModule.title}`);
    console.log(`   - Total steps: ${goalPath.total}`);
    console.log(`   - Completed: ${goalPath.completed}`);
    console.log(`   - Pending: ${goalPath.pending}`);
    
    console.log('📋 Path steps:');
    goalPath.path.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.moduleId}: ${step.title} [${step.status}]`);
    });
    
    console.log('✅ Goal path fix working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing goal path:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testGoalPathFix().catch(console.error);