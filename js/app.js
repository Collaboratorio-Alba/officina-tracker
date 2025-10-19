/**
 * App Entry Point
 * Inizializzazione applicazione Tracker Formazione Ciclofficina
 */

import db from './database/db-config.js';
import ModuleManager from './database/module-manager.js';
import DependencyManager from './database/dependency-manager.js';
import ProgressManager from './database/progress-manager.js';
import AssessmentManager from './database/assessment-manager.js';

// Inizializzazione applicazione
async function initApp() {
  console.log('🚲 Inizializzazione Tracker Formazione Ciclofficina...');
  
  try {
    // Attendi che il database sia pronto
    await db.open();
    console.log('✅ Database pronto');
    
    // Carica dati di esempio se il database è vuoto
    const moduleCount = await db.modules.count();
    
    if (moduleCount === 0) {
      console.log('📦 Caricamento dati di esempio...');
      await loadSampleData();
    }
    
    // Mostra statistiche iniziali
    await displayStats();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Applicazione inizializzata con successo!');
    
  } catch (error) {
    console.error('❌ Errore inizializzazione:', error);
    showError('Errore durante l\'inizializzazione dell\'applicazione');
  }
}

/**
 * Carica dati di esempio
 */
async function loadSampleData() {
  try {
    // Importa struttura completa dei corsi
    const response = await fetch('./js/data/courses-structure.json');
    const courseData = await response.json();
    
    // Importa moduli
    await ModuleManager.bulkImportModules(courseData.modules);
    console.log(`✅ Importati ${courseData.modules.length} moduli`);
    
    // Crea dipendenze dai dati JSON
    const modules = await db.modules.toArray();
    const moduleMap = new Map(modules.map(m => [m.code, m.id]));
    
    let dependencyCount = 0;
    for (const dependency of courseData.dependencies) {
      const moduleId = moduleMap.get(dependency.moduleCode);
      const prerequisiteId = moduleMap.get(dependency.prerequisiteCode);
      
      if (moduleId && prerequisiteId) {
        await DependencyManager.addDependency(moduleId, prerequisiteId, dependency.type);
        dependencyCount++;
      } else {
        console.warn(`⚠️ Dipendenza non creata: ${dependency.moduleCode} -> ${dependency.prerequisiteCode}`);
      }
    }
    
    console.log(`✅ Create ${dependencyCount} dipendenze`);
    
  } catch (error) {
    console.error('❌ Errore caricamento dati di esempio:', error);
    throw error;
  }
}

/**
 * Mostra statistiche nel console
 */
async function displayStats() {
  try {
    const stats = await ProgressManager.getStats();
    
    console.log('\n📊 STATISTICHE CORRENTI');
    console.log('========================');
    console.log(`Moduli totali: ${stats.total}`);
    console.log(`Completati: ${stats.completed} (${stats.completionRate}%)`);
    console.log(`In corso: ${stats.inProgress}`);
    console.log(`Da iniziare: ${stats.notStarted}`);
    console.log(`Score medio: ${stats.averageScore}/100`);
    console.log('\n📚 Per categoria:');
    
    Object.entries(stats.byCategory).forEach(([category, data]) => {
      console.log(`  ${category}: ${data.completed}/${data.total} completati`);
    });
    
    console.log('========================\n');
    
  } catch (error) {
    console.error('❌ Errore visualizzazione statistiche:', error);
  }
}

/**
 * Setup event listeners (placeholder per UI futura)
 */
function setupEventListeners() {
  // Questo verrà espanso nelle fasi successive
  console.log('🎯 Event listeners pronti');
}

/**
 * Mostra messaggio di errore
 */
function showError(message) {
  console.error(`❌ ${message}`);
  // Nelle fasi successive questo mostrerà un toast/modal
}

// Esponi funzioni globali per testing da console
window.CiclofficinaTracker = {
  db,
  ModuleManager,
  DependencyManager,
  ProgressManager,
  AssessmentManager,
  displayStats
};

// Avvia applicazione quando DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

