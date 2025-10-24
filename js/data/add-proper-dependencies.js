/**
 * Script to add proper dependencies based on actual prerequisites
 * Only adds the nearest required modules for each topic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Proper dependencies based on actual nearest prerequisites
const properDependencies = {
  // Level 0 - Foundation skills (no dependencies)
  'BIKE-0.1.1': [], // Cleaning errors - no prerequisites
  'BIKE-0.1.2': ['BIKE-0.1.1'], // Transmission cleaning requires cleaning basics
  'BIKE-0.1.3': ['BIKE-0.1.1'], // Wheel cleaning requires cleaning basics
  'BIKE-0.1.4': ['BIKE-0.1.1'], // Modern parts requires cleaning basics
  'BIKE-0.1.5': ['BIKE-0.1.1'], // Brake cleaning requires cleaning basics
  'BIKE-0.1.6': [], // Minimum tools - no prerequisites
  'BIKE-0.1.7': ['BIKE-0.1.6'], // Ergonomics requires minimum tools
  
  // Level 1 - Workshop setup and safety
  'BIKE-1.1.1': [], // Safety - no prerequisites
  'BIKE-1.1.2': ['BIKE-1.1.1'], // Workstands require safety knowledge
  'BIKE-1.1.3': ['BIKE-1.1.1'], // Tools require safety knowledge
  'BIKE-1.1.4': ['BIKE-1.1.3'], // Workshop organization requires tool knowledge
  'BIKE-1.1.5': ['BIKE-1.1.1', 'BIKE-0.1.1'], // Workshop cleaning requires safety and cleaning
  'BIKE-1.1.6': ['BIKE-1.1.3'], // Consumables require tool knowledge
  'BIKE-1.1.7': ['BIKE-1.1.4'], // Record keeping requires workshop organization
  
  // Level 2 - Bike types and components
  'BIKE-2.1.1': ['BIKE-1.1.3'], // Bike types require tool knowledge
  'BIKE-2.1.2': ['BIKE-2.1.1'], // Thread standards require bike type knowledge
  'BIKE-2.1.3': ['BIKE-2.1.2', 'BIKE-1.1.3'], // Torque specs require thread and tool knowledge
  'BIKE-2.1.4': ['BIKE-2.1.1'], // Component nomenclature requires bike type knowledge
  'BIKE-2.1.5': ['BIKE-2.1.4'], // Technical documentation requires component knowledge
  'BIKE-2.1.6': ['BIKE-2.1.5'], // Compatibility identification requires documentation skills
  'BIKE-2.1.7': ['BIKE-2.1.4'], // Bike anatomy requires component knowledge
  
  // Level 3 - Wheels and tires
  'BIKE-3.1.1': ['BIKE-2.1.7'], // Wheel types require bike anatomy knowledge
  'BIKE-3.1.2': ['BIKE-3.1.1'], // Tubes and valves require wheel type knowledge
  'BIKE-3.1.3': ['BIKE-3.1.2', 'BIKE-1.1.3'], // Tire mounting requires tube knowledge and tools
  'BIKE-3.1.4': ['BIKE-3.1.3'], // Puncture repair requires tire mounting skills
  'BIKE-3.1.5': ['BIKE-3.1.1', 'BIKE-2.1.3'], // Spoke replacement requires wheel knowledge and torque skills
  'BIKE-3.1.6': ['BIKE-3.1.5', 'BIKE-1.1.2'], // Wheel truing requires spoke skills and workstand
  'BIKE-3.1.7': ['BIKE-3.1.6', 'BIKE-2.1.3'], // Wheel building requires truing and torque skills
  
  // Level 4 - Brakes
  'BIKE-4.1.1': ['BIKE-2.1.7'], // Brake types require bike anatomy knowledge
  'BIKE-4.1.2': ['BIKE-4.1.1'], // Brake diagnosis requires brake type knowledge
  'BIKE-4.1.3': ['BIKE-4.1.2', 'BIKE-1.1.3', 'BIKE-2.1.3'], // Pad adjustment requires diagnosis, tools, and torque
  'BIKE-4.1.4': ['BIKE-4.1.3', 'BIKE-1.1.6'], // Cable replacement requires pad adjustment and lubricant knowledge
  'BIKE-4.1.5': ['BIKE-4.1.4', 'BIKE-1.1.6'], // Hydraulic bleeding requires cable work and fluid knowledge
  'BIKE-4.1.6': ['BIKE-4.1.2'], // Pad maintenance requires diagnosis skills
  'BIKE-4.1.7': ['BIKE-4.1.6', 'BIKE-3.1.6'], // Brake vibration diagnosis requires pad maintenance and wheel truing
  
  // Level 5 - Transmission
  'BIKE-5.1.1': ['BIKE-2.1.7'], // Transmission components require bike anatomy
  'BIKE-5.1.2': ['BIKE-5.1.1', 'BIKE-1.1.6'], // Chain maintenance requires component and lubricant knowledge
  'BIKE-5.1.3': ['BIKE-5.1.1', 'BIKE-2.1.6'], // Compatibility requires component and identification knowledge
  'BIKE-5.1.4': ['BIKE-5.1.3', 'BIKE-1.1.3', 'BIKE-2.1.3'], // Cassette work requires compatibility, tools, and torque
  'BIKE-5.1.5': ['BIKE-5.1.4', 'BIKE-2.1.2'], // Bottom bracket inspection requires cassette and thread knowledge
  'BIKE-5.1.6': ['BIKE-5.1.5', 'BIKE-4.1.2'], // Wear diagnosis requires BB inspection and diagnosis skills
  'BIKE-5.1.7': ['BIKE-5.1.6', 'BIKE-2.1.3'], // Fine adjustment requires diagnosis and torque skills
  
  // Level 6 - Shifting systems
  'BIKE-6.1.1': ['BIKE-5.1.1'], // Shifting principles require transmission knowledge
  'BIKE-6.1.2': ['BIKE-6.1.1', 'BIKE-5.1.3', 'BIKE-1.1.3'], // Rear derailleur requires principles, compatibility, tools
  'BIKE-6.1.3': ['BIKE-6.1.2', 'BIKE-5.1.3'], // Front derailleur requires rear derailleur and compatibility
  'BIKE-6.1.4': ['BIKE-6.1.3', 'BIKE-4.1.4'], // Cable tension requires derailleur and cable work
  'BIKE-6.1.5': ['BIKE-6.1.4', 'BIKE-5.1.6'], // Shifting problems requires cable work and wear diagnosis
  'BIKE-6.1.6': ['BIKE-6.1.5', 'BIKE-4.1.4'], // Lever maintenance requires problem diagnosis and cable work
  'BIKE-6.1.7': ['BIKE-6.1.6', 'BIKE-5.1.7'], // Synchronization requires lever work and fine adjustment
  
  // Level 7 - Steering
  'BIKE-7.1.1': ['BIKE-2.1.7'], // Steering types require bike anatomy
  'BIKE-7.1.2': ['BIKE-7.1.1', 'BIKE-2.1.3'], // Preload adjustment requires steering types and torque
  'BIKE-7.1.3': ['BIKE-7.1.2', 'BIKE-1.1.6'], // Bearing service requires preload and lubricant knowledge
  'BIKE-7.1.4': ['BIKE-7.1.3', 'BIKE-5.1.6'], // Fork wear check requires bearing service and wear diagnosis
  'BIKE-7.1.5': ['BIKE-7.1.4', 'BIKE-2.1.2'], // Fork replacement requires wear check and thread knowledge
  'BIKE-7.1.6': ['BIKE-7.1.5', 'BIKE-3.1.6'], // Alignment requires fork work and wheel truing
  'BIKE-7.1.7': ['BIKE-7.1.6', 'BIKE-4.1.7'], // Handling diagnosis requires alignment and vibration diagnosis
  
  // Level 8 - Restoration
  'BIKE-8.1.1': ['BIKE-2.1.7'], // Restoration evaluation requires bike anatomy
  'BIKE-8.1.2': ['BIKE-8.1.1', 'BIKE-1.1.3'], // Complete disassembly requires evaluation and tools
  'BIKE-8.1.3': ['BIKE-8.1.2', 'BIKE-0.1.1'], // Rust treatment requires disassembly and cleaning
  'BIKE-8.1.4': ['BIKE-8.1.3', 'BIKE-1.1.6'], // Paint restoration requires rust treatment and consumables
  'BIKE-8.1.5': ['BIKE-8.1.4', 'BIKE-3.1.7'], // Component rebuild requires paint and wheel building
  'BIKE-8.1.6': ['BIKE-8.1.5', 'BIKE-6.1.7'], // Final assembly requires rebuild and shifting
  'BIKE-8.1.7': ['BIKE-8.1.6', 'BIKE-1.1.7'], // Social projects requires assembly and record keeping
  
  // Level 9 - Complete projects
  'BIKE-9.1.1': ['BIKE-8.1.1', 'BIKE-2.1.6'], // Component selection requires restoration evaluation and compatibility
  'BIKE-9.1.2': ['BIKE-9.1.1', 'BIKE-8.1.6'], // Complete assembly requires selection and final assembly
  'BIKE-9.1.3': ['BIKE-9.1.2', 'BIKE-8.1.4'], // Customization requires assembly and paint skills
  'BIKE-9.1.4': ['BIKE-9.1.3', 'BIKE-8.1.7'], // Restoration project management requires customization and social projects
  'BIKE-9.1.5': ['BIKE-9.1.4', 'BIKE-1.1.7'], // Teaching requires project management and record keeping
  'BIKE-9.1.6': ['BIKE-9.1.5', 'BIKE-8.1.7'], // Sustainability requires teaching and social projects
  'BIKE-9.1.7': ['BIKE-9.1.6'] // Community ethics requires sustainability knowledge
};

function addProperDependencies() {
  console.log('🧠 Adding proper dependencies based on actual nearest prerequisites...');
  
  let totalAddedDependencies = 0;
  let totalModulesUpdated = 0;
  
  // Process each level file
  for (let level = 0; level <= 9; level++) {
    const levelFile = `ciclofficina_level${level}.json`;
    const filePath = path.join(__dirname, levelFile);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let levelModulesUpdated = 0;
      let levelDependenciesAdded = 0;
      
      // Process each module in this level
      data.modules.forEach(module => {
        const moduleId = module.id;
        const dependenciesForModule = properDependencies[moduleId];
        
        if (dependenciesForModule && dependenciesForModule.length > 0) {
          // Initialize dependencies array if it doesn't exist
          if (!module.dependencies) {
            module.dependencies = [];
          }
          
          // Add each dependency if not already present
          dependenciesForModule.forEach(depId => {
            const existingDep = module.dependencies.find(d => d.moduleId === depId);
            
            if (!existingDep) {
              module.dependencies.push({
                moduleId: depId,
                type: 'mandatory'
              });
              levelDependenciesAdded++;
              totalAddedDependencies++;
              console.log(`✅ ${depId} → ${moduleId}`);
            }
          });
          
          levelModulesUpdated++;
          totalModulesUpdated++;
        }
      });
      
      // Write updated data back to file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`📁 Updated ${levelFile}: ${levelDependenciesAdded} dependencies added to ${levelModulesUpdated} modules`);
      
    } catch (error) {
      console.error(`❌ Error processing ${levelFile}:`, error.message);
    }
  }
  
  console.log(`\n🎉 COMPLETED: Added ${totalAddedDependencies} proper dependencies across ${totalModulesUpdated} modules`);
  console.log(`📊 This creates a meaningful learning path with actual prerequisites`);
  
  return totalAddedDependencies;
}

// Run the script
addProperDependencies();

export default addProperDependencies;