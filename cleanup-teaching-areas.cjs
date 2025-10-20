const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up teaching areas and removing category fields...');

const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
let filesModified = 0;

levels.forEach(level => {
  const filePath = path.join(__dirname, 'js/data', `ciclofficina_level${level}.json`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    // Clean up teaching area names
    if (data.teachingArea && data.teachingArea.name) {
      const oldName = data.teachingArea.name;
      // Remove "Livello x -- " prefix
      const newName = oldName.replace(/^Livello \d+ — /, '');
      if (newName !== oldName) {
        data.teachingArea.name = newName;
        console.log(`📝 Level ${level}: "${oldName}" → "${newName}"`);
        modified = true;
      }
    }

    // Remove category fields from modules
    if (data.courses) {
      // Level 1 structure
      data.courses.forEach(course => {
        if (course.teachingAreas) {
          course.teachingAreas.forEach(teachingArea => {
            if (teachingArea.modules) {
              teachingArea.modules.forEach(module => {
                if (module.category || module.categories) {
                  delete module.category;
                  delete module.categories;
                  modified = true;
                }
              });
            }
          });
        }
      });
    } else if (data.modules) {
      // Other levels structure
      data.modules.forEach(module => {
        if (module.category || module.categories) {
          delete module.category;
          delete module.categories;
          modified = true;
        }
      });
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      filesModified++;
      console.log(`✅ Level ${level}: Cleaned up`);
    }

  } catch (error) {
    console.log(`⚠️ Could not process level ${level}:`, error.message);
  }
});

console.log(`\n📊 Summary: Modified ${filesModified} out of ${levels.length} files`);
console.log('🎉 Cleanup completed!');