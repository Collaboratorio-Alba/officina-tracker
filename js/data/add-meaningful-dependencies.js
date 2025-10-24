/**
 * Script to add meaningful dependencies based on actual prerequisites
 * Each dependency represents required knowledge to understand and perform a specific task
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Meaningful dependencies based on actual prerequisites
const meaningfulDependencies = {
  // Level 0 - Foundation skills
  'BIKE-0.0.0': [], // Cleaning errors - no prerequisites
  
  // Level 1 - Workshop setup and safety
  'BIKE-1.0.0': [], // Safety - no prerequisites
  'BIKE-1.0.1': ['BIKE-1.0.0'], // Workstands require safety knowledge
  'BIKE-1.0.2': ['BIKE-1.0.0'], // Tools require safety knowledge
  'BIKE-1.0.3': ['BIKE-1.0.2'], // Workshop organization requires tool knowledge
  'BIKE-1.0.4': ['BIKE-1.0.0', 'BIKE-0.0.0'], // Workshop cleaning requires safety and cleaning knowledge
  'BIKE-1.0.5': ['BIKE-1.0.2'], // Consumables require tool knowledge
  'BIKE-1.0.6': ['BIKE-1.0.3'], // Record keeping requires workshop organization
  
  // Level 2 - Bike types and components
  'BIKE-2.0.0': ['BIKE-1.0.2'], // Bike types require tool knowledge
  'BIKE-2.0.1': ['BIKE-2.0.0'], // Thread standards require bike type knowledge
  'BIKE-2.0.2': ['BIKE-2.0.1', 'BIKE-1.0.2'], // Torque specs require thread and tool knowledge
  'BIKE-2.0.3': ['BIKE-2.0.0'], // Component nomenclature requires bike type knowledge
  'BIKE-2.0.4': ['BIKE-2.0.3'], // Technical documentation requires component knowledge
  'BIKE-2.0.5': ['BIKE-2.0.4'], // Compatibility identification requires documentation skills
  'BIKE-2.0.6': ['BIKE-2.0.3'], // Bike anatomy requires component knowledge
  
  // Level 3 - Wheels and tires
  'BIKE-3.0.0': ['BIKE-2.0.6'], // Wheel types require bike anatomy knowledge
  'BIKE-3.0.1': ['BIKE-3.0.0'], // Tubes and valves require wheel type knowledge
  'BIKE-3.0.2': ['BIKE-3.0.1', 'BIKE-1.0.2'], // Tire mounting requires tube knowledge and tools
  'BIKE-3.0.3': ['BIKE-3.0.2'], // Puncture repair requires tire mounting skills
  'BIKE-3.0.4': ['BIKE-3.0.0', 'BIKE-2.0.2'], // Spoke replacement requires wheel knowledge and torque skills
  'BIKE-3.0.5': ['BIKE-3.0.4', 'BIKE-1.0.1'], // Wheel truing requires spoke skills and workstand
  'BIKE-3.0.6': ['BIKE-3.0.5', 'BIKE-2.0.2'], // Wheel building requires truing and torque skills
  
  // Level 4 - Brakes
  'BIKE-4.0.0': ['BIKE-2.0.6'], // Brake types require bike anatomy knowledge
  'BIKE-4.0.1': ['BIKE-4.0.0'], // Brake diagnosis requires brake type knowledge
  'BIKE-4.0.2': ['BIKE-4.0.1', 'BIKE-1.0.2', 'BIKE-2.0.2'], // Pad adjustment requires diagnosis, tools, and torque
  'BIKE-4.0.3': ['BIKE-4.0.2', 'BIKE-1.0.5'], // Cable replacement requires pad adjustment and lubricant knowledge
  'BIKE-4.0.4': ['BIKE-4.0.3', 'BIKE-1.0.5'], // Hydraulic bleeding requires cable work and fluid knowledge
  'BIKE-4.0.5': ['BIKE-4.0.1'], // Pad maintenance requires diagnosis skills
  'BIKE-4.0.6': ['BIKE-4.0.5', 'BIKE-3.0.5'], // Brake vibration diagnosis requires pad maintenance and wheel truing
  
  // Level 5 - Transmission
  'BIKE-5.0.0': ['BIKE-2.0.6'], // Transmission components require bike anatomy
  'BIKE-5.0.1': ['BIKE-5.0.0', 'BIKE-1.0.5'], // Chain maintenance requires component and lubricant knowledge
  'BIKE-5.0.2': ['BIKE-5.0.0', 'BIKE-2.0.5'], // Compatibility requires component and identification knowledge
  'BIKE-5.0.3': ['BIKE-5.0.2', 'BIKE-1.0.2', 'BIKE-2.0.2'], // Cassette work requires compatibility, tools, and torque
  'BIKE-5.0.4': ['BIKE-5.0.3', 'BIKE-2.0.1'], // Bottom bracket inspection requires cassette and thread knowledge
  'BIKE-5.0.5': ['BIKE-5.0.4', 'BIKE-4.0.1'], // Wear diagnosis requires BB inspection and diagnosis skills
  'BIKE-5.0.6': ['BIKE-5.0.5', 'BIKE-2.0.2'], // Fine adjustment requires diagnosis and torque skills
  
  // Level 6 - Shifting systems
  'BIKE-6.0.0': ['BIKE-5.0.0'], // Shifting principles require transmission knowledge
  'BIKE-6.0.1': ['BIKE-6.0.0', 'BIKE-5.0.2', 'BIKE-1.0.2'], // Rear derailleur requires principles, compatibility, tools
  'BIKE-6.0.2': ['BIKE-6.0.1', 'BIKE-5.0.2'], // Front derailleur requires rear derailleur and compatibility
  'BIKE-6.0.3': ['BIKE-6.0.2', 'BIKE-4.0.3'], // Cable tension requires derailleur and cable work
  'BIKE-6.0.4': ['BIKE-6.0.3', 'BIKE-5.0.5'], // Shifting problems requires cable work and wear diagnosis
  'BIKE-6.0.5': ['BIKE-6.0.4', 'BIKE-4.0.3'], // Lever maintenance requires problem diagnosis and cable work
  'BIKE-6.0.6': ['BIKE-6.0.5', 'BIKE-5.0.6'], // Synchronization requires lever work and fine adjustment
  
  // Level 7 - Steering
  'BIKE-7.0.0': ['BIKE-2.0.6'], // Steering types require bike anatomy
  'BIKE-7.0.1': ['BIKE-7.0.0', 'BIKE-2.0.2'], // Preload adjustment requires steering types and torque
  'BIKE-7.0.2': ['BIKE-7.0.1', 'BIKE-1.0.5'], // Bearing service requires preload and lubricant knowledge
  'BIKE-7.0.3': ['BIKE-7.0.2', 'BIKE-5.0.5'], // Fork wear check requires bearing service and wear diagnosis
  'BIKE-7.0.4': ['BIKE-7.0.3', 'BIKE-2.0.1'], // Fork replacement requires wear check and thread knowledge
  'BIKE-7.0.5': ['BIKE-7.0.4', 'BIKE-3.0.5'], // Alignment requires fork work and wheel truing
  'BIKE-7.0.6': ['BIKE-7.0.5', 'BIKE-4.0.6'], // Handling diagnosis requires alignment and vibration diagnosis
  
  // Level 8 - Restoration
  'BIKE-8.0.0': [
    'BIKE-2.0.6', 'BIKE-3.0.0', 'BIKE-4.0.0', 'BIKE-5.0.0', 'BIKE-6.0.0', 'BIKE-7.0.0'
  ], // Restoration evaluation requires comprehensive bike knowledge
  'BIKE-8.0.1': [
    'BIKE-8.0.0', 'BIKE-1.0.2', 'BIKE-1.0.3'
  ], // Complete disassembly requires evaluation, tools, and organization
  'BIKE-8.0.2': [
    'BIKE-8.0.1', 'BIKE-0.0.0', 'BIKE-1.0.4'
  ], // Rust treatment requires disassembly, cleaning, and workshop maintenance
  'BIKE-8.0.3': [
    'BIKE-8.0.2', 'BIKE-1.0.5'
  ], // Paint restoration requires rust treatment and consumables
  'BIKE-8.0.4': [
    'BIKE-8.0.3', 'BIKE-3.0.6', 'BIKE-5.0.6', 'BIKE-4.0.6'
  ], // Component rebuild requires paint, wheel building, transmission, and brakes
  'BIKE-8.0.5': [
    'BIKE-8.0.4', 'BIKE-6.0.6', 'BIKE-7.0.6'
  ], // Final assembly requires rebuild, shifting, and steering
  'BIKE-8.0.6': [
    'BIKE-8.0.5', 'BIKE-1.0.6'
  ], // Social projects requires assembly and record keeping
  
  // Level 9 - Complete projects
  'BIKE-9.0.0': [
    'BIKE-8.0.0', 'BIKE-2.0.5'
  ], // Component selection requires restoration evaluation and compatibility
  'BIKE-9.0.1': [
    'BIKE-9.0.0', 'BIKE-8.0.5'
  ], // Complete assembly requires selection and final assembly
  'BIKE-9.0.2': [
    'BIKE-9.0.1', 'BIKE-8.0.3'
  ], // Customization requires assembly and paint skills
  'BIKE-9.0.3': [
    'BIKE-9.0.2', 'BIKE-8.0.6'
  ], // Restoration project management requires customization and social projects
  'BIKE-9.0.4': [
    'BIKE-9.0.3', 'BIKE-1.0.6'
  ], // Teaching requires project management and record keeping
  'BIKE-9.0.5': [
    'BIKE-9.0.4', 'BIKE-8.0.6'
  ], // Sustainability requires teaching and social projects
  'BIKE-9.0.6': [
    'BIKE-9.0.5'
  ] // Community ethics requires sustainability knowledge
};

function addMeaningfulDependencies() {
  console.log('🧠 Adding meaningful dependencies based on actual prerequisites...');
  
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
        const dependenciesForModule = meaningfulDependencies[moduleId];
        
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
  
  console.log(`\n🎉 COMPLETED: Added ${totalAddedDependencies} meaningful dependencies across ${totalModulesUpdated} modules`);
  console.log(`📊 This creates a comprehensive learning path with actual prerequisites`);
  
  return totalAddedDependencies;
}

// Run the script
addMeaningfulDependencies();

export default addMeaningfulDependencies;