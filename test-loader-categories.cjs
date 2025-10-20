const fs = require('fs');
const path = require('path');

// Simple test to verify the updated level-data-loader.js works with categories
console.log('🧪 Testing updated level-data-loader.js...');

// Simulate what the loader does
const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
let allModules = [];

levels.forEach(level => {
  const filePath = path.join(__dirname, 'js/data', 'ciclofficina_level' + level + '.json');
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modules = [];
    
    if (data.courses) {
      modules = data.courses[0].teachingAreas[0].modules || [];
    } else if (data.modules) {
      modules = data.modules;
    }
    
    // Simulate the convertToExtendedSchema function
    const processedModules = modules.map(module => ({
      code: module.id,
      title: module.title,
      category: module.category || 'generale', // Use actual category if available
      categories: module.categories || [], // Include secondary categories
      teachingArea: module.teachingArea || data.teachingArea?.name
    }));
    
    allModules.push(...processedModules);
    
  } catch (error) {
    console.log('⚠️ Could not load level', level, error.message);
  }
});

console.log('📊 Loader Test Results:');
console.log('   - Total modules loaded:', allModules.length);

const modulesWithCategory = allModules.filter(m => m.category && m.category !== 'generale').length;
const modulesWithCategories = allModules.filter(m => m.categories && m.categories.length > 0).length;

console.log('   - Modules with specific category:', modulesWithCategory, '(', ((modulesWithCategory / allModules.length) * 100).toFixed(1) + '%)');
console.log('   - Modules with secondary categories:', modulesWithCategories, '(', ((modulesWithCategories / allModules.length) * 100).toFixed(1) + '%)');

// Show some sample categories
const uniqueCategories = [...new Set(allModules.map(m => m.category).filter(c => c))];
console.log('   - Unique categories found:', uniqueCategories.length);
console.log('   - Sample categories:', uniqueCategories.slice(0, 5));

// Show some modules with secondary categories
const modulesWithSecondary = allModules.filter(m => m.categories && m.categories.length > 0);
if (modulesWithSecondary.length > 0) {
  console.log('\\n📋 Sample modules with secondary categories:');
  modulesWithSecondary.slice(0, 3).forEach(module => {
    console.log('   -', module.code + ':', module.title);
    console.log('     Primary:', module.category);
    console.log('     Secondary:', module.categories.join(', '));
  });
}