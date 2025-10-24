/**
 * Script to combine all ciclofficina level JSON files into a single file
 * Usage: node combine-levels.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically discover level files
function getLevelFiles() {
  const files = fs.readdirSync(__dirname);
  return files
    .filter(file => file.startsWith('ciclofficina_level') && file.endsWith('.json'))
    .sort((a, b) => {
      // Extract level numbers for proper sorting
      const levelA = parseInt(a.match(/level(\d+)/)?.[1] || 0);
      const levelB = parseInt(b.match(/level(\d+)/)?.[1] || 0);
      return levelA - levelB;
    });
}

const levelFiles = getLevelFiles();

function combineLevels() {
  console.log('🚀 Starting to combine level files...');
  
  const combinedData = {
    version: "1.1.0",
    schemaNotes: "Combined dataset of all 13 levels for analysis purposes",
    metadata: {
      totalLevels: levelFiles.length,
      totalModules: 0,
      teachingAreas: [],
      generatedAt: new Date().toISOString(),
      sourceFiles: levelFiles
    },
    levels: []
  };

  let totalModules = 0;
  const teachingAreas = new Set();

  // Process each level file
  levelFiles.forEach((filename, index) => {
    try {
      const filePath = path.join(__dirname, filename);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filename}`);
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const levelData = JSON.parse(fileContent);
      
      // Extract level number from filename
      const levelMatch = filename.match(/level(\d+)/);
      const levelNumber = levelMatch ? parseInt(levelMatch[1]) : index;

      let levelInfo = {
        level: levelNumber,
        filename: filename,
        teachingArea: null,
        modules: []
      };

      // Handle different file structures
      if (levelData.courses) {
        // Structure for level 1 (contains courses array)
        const course = levelData.courses[0];
        if (course && course.teachingAreas) {
          const teachingArea = course.teachingAreas[0];
          levelInfo.teachingArea = {
            name: teachingArea.name,
            description: teachingArea.description,
            color: teachingArea.color
          };
          levelInfo.modules = teachingArea.modules || [];
        }
      } else if (levelData.teachingArea) {
        // Structure for other levels (direct teachingArea)
        levelInfo.teachingArea = {
          name: levelData.teachingArea.name,
          description: levelData.teachingArea.description,
          color: levelData.teachingArea.color
        };
        levelInfo.modules = levelData.modules || [];
      }

      // Add teaching area to metadata
      if (levelInfo.teachingArea) {
        teachingAreas.add(levelInfo.teachingArea.name);
      }

      // Count modules
      totalModules += levelInfo.modules.length;

      // Add level to combined data
      combinedData.levels.push(levelInfo);
      
      console.log(`✅ Processed ${filename}: ${levelInfo.modules.length} modules`);

    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
    }
  });

  // Update metadata
  combinedData.metadata.totalModules = totalModules;
  combinedData.metadata.teachingAreas = Array.from(teachingAreas);

  // Write combined file
  const outputPath = path.join(__dirname, 'ciclofficina_all_levels_combined.json');
  fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2), 'utf8');

  console.log('\n🎉 Successfully combined all level files!');
  console.log(`📊 Summary:`);
  console.log(`   - Levels: ${combinedData.levels.length}`);
  console.log(`   - Total Modules: ${totalModules}`);
  console.log(`   - Teaching Areas: ${teachingAreas.size}`);
  console.log(`   - Output file: ${outputPath}`);
  
  return combinedData;
}

// Run the script if called directly
combineLevels();

export default combineLevels;
