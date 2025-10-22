/**
 * Script per verificare le dipendenze del nuovo modulo BIKE-1.5.1
 */

import fs from 'fs';

// Carica il file level1.json
const level1 = JSON.parse(fs.readFileSync('./js/data/ciclofficina_level1.json', 'utf8'));

// Trova il nuovo modulo
const modules = level1.courses[0].teachingAreas[0].modules;
const newModule = modules.find(m => m.id === 'BIKE-1.5.1');

console.log('🔍 VERIFICA MODULO E DIPENDENZE');
console.log('================================');

if (newModule) {
  console.log(`✅ Modulo trovato: ${newModule.id} - ${newModule.title}`);
  console.log(`📝 Descrizione: ${newModule.description}`);
  
  if (newModule.dependencies && newModule.dependencies.length > 0) {
    console.log(`\n🔗 DIPENDENZE CONFIGURATE (${newModule.dependencies.length}):`);
    newModule.dependencies.forEach(dep => {
      console.log(`   - ${dep.moduleId} (${dep.type})`);
    });
    
    // Verifica che i moduli prerequisiti esistano
    console.log('\n🔍 VERIFICA ESISTENZA MODULI PREREQUISITI:');
    const prereqIds = newModule.dependencies.map(dep => dep.moduleId);
    
    prereqIds.forEach(prereqId => {
      const prereqModule = modules.find(m => m.id === prereqId);
      if (prereqModule) {
        console.log(`   ✅ ${prereqId}: ${prereqModule.title}`);
      } else {
        console.log(`   ❌ ${prereqId}: MODULO NON TROVATO IN LEVEL 1`);
      }
    });
    
  } else {
    console.log('❌ Nessuna dipendenza configurata per questo modulo');
  }
  
} else {
  console.log('❌ Modulo BIKE-1.5.1 non trovato in level1.json');
}

console.log('\n📊 STATISTICHE LEVEL 1:');
console.log(`   - Moduli totali: ${modules.length}`);
console.log(`   - Nuovo modulo: ${newModule ? 'PRESENTE' : 'ASSENTE'}`);
console.log(`   - Dipendenze configurate: ${newModule ? newModule.dependencies.length : 0}`);

console.log('\n🎯 ISTRUZIONI PER FISSARE DIPENDENZE:');
console.log('1. Apri la console del browser (F12)');
console.log('2. Esegui: CiclofficinaTracker.fixMissingDependencies()');
console.log('3. Attendi il ricaricamento della pagina');
console.log('4. Verifica che le dipendenze appaiano nel grafo');