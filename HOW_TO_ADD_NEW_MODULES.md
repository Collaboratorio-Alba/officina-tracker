# How to Add New Modules to the Application

## 📋 Overview

When you add new modules to JSON files, they need to be loaded into the application's database to become visible. Here are the methods available:

## 🔧 Method 1: Using the AddNewModules Utility (Recommended)

### Quick One-Line Command

```javascript
// Run this in browser console after adding modules to JSON files
await AddNewModules.addMissingModules();
```

### Step-by-Step Process

1. **Add modules to JSON file** (e.g., `js/data/ciclofficina_level6.json`)
2. **Open browser console** (F12 → Console)
3. **Run the utility**:
   ```javascript
   // Import and run the utility
   import('./js/utils/add-new-modules.js').then(async ({default: AddNewModules}) => {
     const result = await AddNewModules.addMissingModules();
     console.log('Result:', result);
   });
   ```

### Verification

```javascript
// Check if specific modules are present
import('./js/utils/add-new-modules.js').then(async ({default: AddNewModules}) => {
  const check = await AddNewModules.checkModules(['BIKE-6.5.1', 'BIKE-6.5.2']);
  console.log('Module check:', check);
});
```

## 🔄 Method 2: Using cleanSetup() (Resets Progress)

**Warning**: This method deletes all existing progress data.

```javascript
// In browser console
cleanSetup();
```

**Use this only when:**
- You want a completely fresh start
- Progress data is not important
- You're testing the full module structure

## 🛠️ Method 3: Manual Database Update

### Check Current State

```javascript
// See what's in the database
import('./js/database/module-manager.js').then(async ({default: ModuleManager}) => {
  const modules = await ModuleManager.getAllModules();
  console.log('Total modules:', modules.length);
  console.log('Module codes:', modules.map(m => m.code));
});
```

### Add Specific Modules

```javascript
// Add only specific modules
import('./js/utils/add-new-modules.js').then(async ({default: AddNewModules}) => {
  const result = await AddNewModules.addSpecificModules(['BIKE-6.5.1', 'BIKE-6.5.2']);
  console.log('Added modules:', result);
});
```

## 📁 File Structure for New Modules

### JSON File Format

```json
{
  "teachingArea": {
    "name": "Ruote e Mozzi",
    "description": "Area description",
    "color": "#1abc9c"
  },
  "modules": [
    {
      "id": "BIKE-6.5.1",
      "title": "Module Title",
      "description": "Module description",
      "difficulty": "base|intermedio|avanzato",
      "estimatedDuration": 15,
      "contentPath": "/content/bike-6.5.1.md",
      "toolsRequired": ["tool1", "tool2"],
      "learningOutcomes": ["Outcome 1", "Outcome 2"],
      "practicalCriteria": ["Criterion 1", "Criterion 2"],
      "skillTags": ["tag1", "tag2"],
      "revisionDate": null,
      "dependencies": [
        {
          "moduleId": "BIKE-6.2.1",
          "type": "mandatory"
        }
      ]
    }
  ]
}
```

## 🎯 Best Practices

### 1. Module ID Format
- Use consistent format: `BIKE-{level}.{area}.{sequence}`
- Example: `BIKE-6.5.1` (Level 6, Area 5, Module 1)

### 2. Dependencies
- Always specify dependencies to maintain learning path
- Use `"type": "mandatory"` for required prerequisites
- Use `"type": "recommended"` for suggested prerequisites

### 3. Skill Tags
- Use descriptive tags for filtering and categorization
- Examples: `raggi`, `centratura`, `emergenze`, `precisione`

### 4. Difficulty Levels
- `base`: Basic skills, no prior knowledge required
- `intermedio`: Some experience needed
- `avanzato`: Advanced techniques, requires prerequisites

## 🔍 Troubleshooting

### Modules Not Appearing

1. **Check JSON syntax**:
   ```javascript
   // Validate JSON file
   fetch('./js/data/ciclofficina_level6.json')
     .then(r => r.json())
     .then(data => console.log('JSON valid:', data.modules.length))
     .catch(err => console.error('JSON error:', err));
   ```

2. **Verify database state**:
   ```javascript
   // Check database vs JSON
   import('./js/data/level-data-loader.js').then(async ({default: LevelDataLoader}) => {
     await LevelDataLoader.loadAllLevels();
     const jsonModules = LevelDataLoader.getAllModules();
     console.log('JSON modules:', jsonModules.length);
   });
   ```

3. **Force reload**:
   ```javascript
   // Clear cache and reload
   location.reload(true);
   ```

### Common Issues

- **Missing dependencies**: Ensure prerequisite modules exist
- **Invalid IDs**: Check module ID format and uniqueness
- **JSON syntax errors**: Validate JSON structure
- **Database corruption**: Use `cleanSetup()` as last resort

## 📊 Monitoring

### Check Module Statistics

```javascript
// Get module statistics
import('./js/database/module-manager.js').then(async ({default: ModuleManager}) => {
  const stats = await ModuleManager.getModuleStats();
  console.log('Module stats:', stats);
});
```

### Verify Teaching Areas

```javascript
// Check teaching area distribution
import('./js/database/module-manager.js').then(async ({default: ModuleManager}) => {
  const modules = await ModuleManager.getAllModules();
  const areas = {};
  modules.forEach(m => {
    areas[m.teachingArea] = (areas[m.teachingArea] || 0) + 1;
  });
  console.log('Teaching areas:', areas);
});
```

## 🚀 Quick Reference Commands

### For Developers

```javascript
// Complete workflow
async function addNewModulesWorkflow() {
  // 1. Check current state
  const check = await AddNewModules.checkModules(['NEW-MODULE-1', 'NEW-MODULE-2']);
  console.log('Before:', check);
  
  // 2. Add missing modules
  const result = await AddNewModules.addMissingModules();
  console.log('Addition result:', result);
  
  // 3. Verify
  const finalCheck = await AddNewModules.checkModules(['NEW-MODULE-1', 'NEW-MODULE-2']);
  console.log('After:', finalCheck);
  
  // 4. Reload UI
  location.reload();
}
```

### For Users

Simply run in browser console:
```javascript
await AddNewModules.addMissingModules();
```

## 📞 Support

If issues persist:
1. Check browser console for errors
2. Verify JSON file is accessible via browser
3. Ensure all dependencies exist
4. Try the test script: `node js/test-add-new-modules.js`

Remember: **Always use `AddNewModules.addMissingModules()`** to preserve user progress when adding new modules.