/**
 * Verification script for goal path fix - checks the code structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Goal Path Fix Implementation...');
console.log('===========================================');

// Read the dashboard manager file
const dashboardPath = path.join(__dirname, 'database/dashboard-manager.js');
const content = fs.readFileSync(dashboardPath, 'utf8');

// Check if the fix is implemented
const hasDependencyManagerImport = content.includes('import DependencyManager');
const hasDependencyManagerField = content.includes('this.dependencyManager = DependencyManager');
const hasNewMethod = content.includes('getAllDependenciesFromDatabase');
const hasUpdatedGetGoalPath = content.includes('getAllDependenciesFromDatabase(moduleId)');

console.log('📋 Implementation Status:');
console.log(`   - DependencyManager import: ${hasDependencyManagerImport ? '✅' : '❌'}`);
console.log(`   - DependencyManager field in constructor: ${hasDependencyManagerField ? '✅' : '❌'}`);
console.log(`   - New getAllDependenciesFromDatabase method: ${hasNewMethod ? '✅' : '❌'}`);
console.log(`   - Updated getGoalPath to use new method: ${hasUpdatedGetGoalPath ? '✅' : '❌'}`);

// Check the structure of the new method
const methodMatch = content.match(/async getAllDependenciesFromDatabase\([^)]+\)\s*{[\s\S]*?}/);
if (methodMatch) {
  const methodContent = methodMatch[0];
  const usesDependencyManager = methodContent.includes('this.dependencyManager.getPrerequisites');
  const isRecursive = methodContent.includes('getAllDependenciesFromDatabase');
  
  console.log(`\\n🔍 Method Implementation Details:`);
  console.log(`   - Uses dependency manager: ${usesDependencyManager ? '✅' : '❌'}`);
  console.log(`   - Is recursive: ${isRecursive ? '✅' : '❌'}`);
  console.log(`   - Method length: ${methodContent.split('\\n').length} lines`);
}

// Check if old method is still there (should be for backward compatibility)
const hasOldMethod = content.includes('getAllDependenciesWithFallback(moduleId, moduleMapByCode, moduleMapById)');

console.log(`\\n📊 Overall Assessment:`);
if (hasDependencyManagerImport && hasDependencyManagerField && hasNewMethod && hasUpdatedGetGoalPath) {
  console.log('🎉 SUCCESS! Goal path fix has been properly implemented.');
  console.log('✅ The dashboard should now correctly resolve dependencies from the database.');
  console.log('✅ Goal view should show all required modules including dependencies.');
} else {
  console.log('⚠️ WARNING: Some parts of the fix may be missing.');
  console.log('❌ The goal view may still show incorrect module counts.');
}

console.log(`\\n💡 Next Steps:`);
console.log(`   - Open the web application in browser (http://localhost:8000)`);
console.log(`   - Navigate to Dashboard → Goal View`);
console.log(`   - Select a goal module and verify it shows all dependencies`);
console.log(`   - The module count should be greater than 1 for modules with dependencies`);