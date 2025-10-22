/**
 * Script per verificare se il modulo BIKE-1.5.1 è richiesto come prerequisito da altri moduli
 */

import fs from 'fs';

// Carica tutti i file di livello
const levelFiles = [
  'ciclofficina_level1.json',
  'ciclofficina_level2.json',
  'ciclofficina_level3.json',
  'ciclofficina_level4.json',
  'ciclofficina_level5.json',
  'ciclofficina_level6.json',
  'ciclofficina_level7.json',
  'ciclofficina_level8.json',
  'ciclofficina_level9.json',
  'ciclofficina_level10.json',
  'ciclofficina_level11.json'
];

console.log('🔍 ANALISI DIPENDENZE PER MODULO BIKE-1.5.1');
console.log('===========================================\n');

let modulesRequiringBIKE151 = [];

// Analizza ogni file di livello
for (const levelFile of levelFiles) {
  try {
    const levelData = JSON.parse(fs.readFileSync(`./js/data/${levelFile}`, 'utf8'));
    
    let modules = [];
    
    // Gestione struttura diversa per livello 1 vs altri livelli
    if (levelData.courses) {
      // Struttura livello 1 (contenente corso completo)
      const course = levelData.courses[0];
      if (course && course.teachingAreas) {
        modules = course.teachingAreas[0].modules || [];
      }
    } else if (levelData.modules) {
      // Struttura altri livelli (modules diretti)
      modules = levelData.modules || [];
    }
    
    // Verifica se qualche modulo richiede BIKE-1.5.1 come prerequisito
    for (const module of modules) {
      if (module.dependencies && Array.isArray(module.dependencies)) {
        const requiresBIKE151 = module.dependencies.some(dep => 
          dep.moduleId === 'BIKE-1.5.1'
        );
        
        if (requiresBIKE151) {
          modulesRequiringBIKE151.push({
            moduleId: module.id,
            moduleTitle: module.title,
            levelFile: levelFile,
            dependencyType: module.dependencies.find(dep => dep.moduleId === 'BIKE-1.5.1').type
          });
        }
      }
    }
    
  } catch (error) {
    console.warn(`⚠️ Errore caricamento ${levelFile}:`, error.message);
  }
}

// Risultati
if (modulesRequiringBIKE151.length > 0) {
  console.log(`✅ MODULI CHE RICHIEDONO BIKE-1.5.1 (${modulesRequiringBIKE151.length}):`);
  modulesRequiringBIKE151.forEach(module => {
    console.log(`   - ${module.moduleId}: ${module.moduleTitle}`);
    console.log(`     File: ${module.levelFile}, Tipo: ${module.dependencyType}`);
  });
} else {
  console.log('❌ NESSUN MODULO RICHIEDE BIKE-1.5.1 COME PREREQUISITO');
}

// Analisi del posizionamento logico
console.log('\n📊 ANALISI POSIZIONAMENTO LOGICO:');
console.log('================================');

// Verifica se ci sono moduli che dovrebbero logicamente dipendere da BIKE-1.5.1
const potentialDependentModules = [
  // Moduli di livelli superiori che potrebbero beneficiare della ricerca documentazione
  'BIKE-10.1.1', // Identificazione materiali telaio
  'BIKE-10.2.1', // Rimozione ruggine meccanica e chimica
  'BIKE-11.1.1', // Compatibilità e scelta componenti
  'BIKE-11.2.1', // Installazione movimento centrale e guarnitura
  'BIKE-11.3.1', // Assemblaggio gruppo trasmissione
  'BIKE-11.4.1', // Collaudo statico e dinamico
];

console.log('\n🎯 MODULI CHE POTREBBERO LOGICAMENTE DIPENDERE DA BIKE-1.5.1:');
console.log('(per ricerca documentazione tecnica specifica)');

potentialDependentModules.forEach(moduleId => {
  console.log(`   - ${moduleId}: Potrebbe beneficiare della ricerca documentazione`);
});

console.log('\n💡 CONSIDERAZIONI:');
console.log('================');
console.log('1. BIKE-1.5.1 è un modulo di ricerca documentazione');
console.log('2. Attualmente non è richiesto da nessun altro modulo');
console.log('3. Questo potrebbe essere corretto se è un modulo opzionale/trasversale');
console.log('4. Oppure potrebbe essere necessario aggiungere dipendenze a moduli avanzati');
console.log('5. La decisione dipende dal design didattico del percorso');

console.log('\n🎯 AZIONI POSSIBILI:');
console.log('===================');
console.log('A) Mantenere come modulo opzionale senza dipendenze in uscita');
console.log('B) Aggiungere dipendenze a moduli avanzati che richiedono ricerca documentazione');
console.log('C) Considerarlo come competenza trasversale non vincolante');