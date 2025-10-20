/**
 * App Entry Point
 * Inizializzazione applicazione Tracker Formazione Ciclofficina (Schema Esteso 1.1.0)
 */

import db from './database/db-config.js';
import ModuleManager from './database/module-manager.js';
import DependencyManager from './database/dependency-manager.js';
import ProgressManager from './database/progress-manager.js';
import AssessmentManager from './database/assessment-manager.js';
import MigrationManager from './database/migration-manager.js';
import LevelDataLoader from './data/level-data-loader.js';
import LevelMigrationManager from './database/level-migration-manager.js';
import DashboardView from './views/dashboard-view.js';

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
    
    // Inizializza vista dashboard
    await initDashboardView();
    
    console.log('✅ Applicazione inizializzata con successo!');
    
  } catch (error) {
    console.error('❌ Errore inizializzazione:', error);
    showError('Errore durante l\'inizializzazione dell\'applicazione');
  }
}

/**
 * Carica dati di esempio (Struttura Modulare a Livelli)
 */
async function loadSampleData() {
  try {
    // Verifica se serve migrazione a struttura modulare
    const needsLevelMigration = await LevelMigrationManager.needsLevelMigration();
    
    if (needsLevelMigration) {
      console.log('🔄 Database esistente rilevato, eseguo migrazione a struttura modulare...');
      await LevelMigrationManager.migrateToLevelStructure();
      return;
    }

    // Carica struttura modulare a livelli
    await LevelDataLoader.loadAllLevels();
    
    if (!LevelDataLoader.isLoaded()) {
      throw new Error('Impossibile caricare struttura modulare');
    }

    // Importa moduli dalla struttura modulare
    const modules = LevelDataLoader.getAllModules();
    await ModuleManager.bulkImportModules(modules);
    console.log(`✅ Importati ${modules.length} moduli (struttura modulare)`);
    
    // Crea dipendenze dai dati modulari
    const dbModules = await db.modules.toArray();
    const moduleMap = new Map(dbModules.map(m => [m.code, m.id]));
    
    let dependencyCount = 0;
    for (const module of modules) {
      if (module.prerequisites && module.prerequisites.length > 0) {
        for (const prereqCode of module.prerequisites) {
          const moduleId = moduleMap.get(module.code);
          const prerequisiteId = moduleMap.get(prereqCode);
          
          if (moduleId && prerequisiteId) {
            await DependencyManager.addDependency(moduleId, prerequisiteId, 'mandatory');
            dependencyCount++;
          } else {
            console.warn(`⚠️ Dipendenza non creata: ${module.code} -> ${prereqCode}`);
          }
        }
      }
    }
    
    console.log(`✅ Create ${dependencyCount} dipendenze`);
    
    // Mostra statistiche struttura modulare
    const stats = LevelDataLoader.getStats();
    console.log('\n📊 STRUTTURA MODULARE CARICATA');
    console.log('==============================');
    console.log(`Livelli: ${stats.levels}`);
    console.log(`Corsi: ${stats.courses}`);
    console.log(`Moduli totali: ${stats.modules}`);
    console.log(`Aree didattiche: ${stats.teachingAreas.join(', ')}`);
    console.log('==============================\n');
    
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
 * Setup event listeners per view switching
 */
function setupEventListeners() {
  console.log('🎯 Setup event listeners per view switching...');
  
  // View switching buttons
  const tableBtn = document.getElementById('table-view-btn');
  const graphBtn = document.getElementById('graph-view-btn');
  const dashboardBtn = document.getElementById('dashboard-view-btn');
  
  if (tableBtn) {
    tableBtn.addEventListener('click', () => switchView('table'));
  }
  
  if (graphBtn) {
    graphBtn.addEventListener('click', () => switchView('graph'));
  }
  
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => switchView('dashboard'));
  }
  
  console.log('✅ Event listeners view switching pronti');
}

/**
 * Inizializza vista dashboard
 */
async function initDashboardView() {
  try {
    console.log('📊 Inizializzazione vista dashboard...');
    await window.dashboardView.init();
    console.log('✅ Vista dashboard inizializzata');
  } catch (error) {
    console.error('❌ Errore inizializzazione dashboard:', error);
  }
}

/**
 * Switch tra viste
 */
function switchView(viewType) {
  console.log(`🔄 Cambio vista: ${viewType}`);
  
  // Nascondi tutte le viste
  const tableView = document.getElementById('table-view');
  const graphView = document.getElementById('graph-view');
  const dashboardView = document.getElementById('dashboard-view');
  
  if (tableView) tableView.style.display = 'none';
  if (graphView) graphView.style.display = 'none';
  if (dashboardView) dashboardView.style.display = 'none';
  
  // Aggiorna stato bottoni
  const tableBtn = document.getElementById('table-view-btn');
  const graphBtn = document.getElementById('graph-view-btn');
  const dashboardBtn = document.getElementById('dashboard-view-btn');
  
  if (tableBtn) tableBtn.classList.remove('active');
  if (graphBtn) graphBtn.classList.remove('active');
  if (dashboardBtn) dashboardBtn.classList.remove('active');
  
  // Mostra vista selezionata
  switch (viewType) {
    case 'table':
      if (tableView) tableView.style.display = 'block';
      if (tableBtn) tableBtn.classList.add('active');
      break;
      
    case 'graph':
      if (graphView) graphView.style.display = 'block';
      if (graphBtn) graphBtn.classList.add('active');
      break;
      
    case 'dashboard':
      if (dashboardView) dashboardView.style.display = 'block';
      if (dashboardBtn) dashboardBtn.classList.add('active');
      // Refresh dashboard data
      window.dashboardView.init().catch(console.error);
      break;
  }
  
  // Gestione filtro area didattica se presente
  handleTeachingAreaFilter(viewType);
}

/**
 * Gestione filtro area didattica per navigazione da dashboard
 */
function handleTeachingAreaFilter(viewType) {
  if (viewType === 'table') {
    const filterArea = sessionStorage.getItem('filterTeachingArea');
    if (filterArea) {
      console.log(`🎯 Applicando filtro area: ${filterArea}`);
      // Qui verrà implementato il filtro nella vista tabella
      // Per ora rimuoviamo il filtro dalla session storage
      sessionStorage.removeItem('filterTeachingArea');
    }
  }
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
  MigrationManager,
  LevelDataLoader,
  LevelMigrationManager,
  displayStats,
  
  // Utility per test schema esteso
  async testExtendedSchema() {
    console.log('🧪 Test Schema Esteso 1.1.0');
    
    try {
      // Test skill tags
      const allTags = await ModuleManager.getAllSkillTags();
      console.log('🏷️ Skill Tags disponibili:', allTags);
      
      // Test content path
      const modules = await ModuleManager.getAllModules();
      const withContentPath = modules.filter(m => m.contentPath);
      console.log(`📁 Moduli con contentPath: ${withContentPath.length}/${modules.length}`);
      
      // Test revision date
      const needsRevision = await ModuleManager.getModulesNeedingRevision(30);
      console.log(`📅 Moduli da revisionare: ${needsRevision.length}`);
      
      return {
        totalModules: modules.length,
        modulesWithContentPath: withContentPath.length,
        skillTags: allTags,
        needsRevision: needsRevision.length
      };
    } catch (error) {
      console.error('❌ Errore test schema esteso:', error);
      throw error;
    }
  },

  // Utility per test struttura modulare
  async testModularStructure() {
    console.log('🧪 Test Struttura Modulare a Livelli');
    
    try {
      await LevelDataLoader.loadAllLevels();
      const stats = LevelDataLoader.getStats();
      const modules = LevelDataLoader.getAllModules();
      
      console.log('📊 Statistiche struttura modulare:');
      console.log(`   - Livelli: ${stats.levels}`);
      console.log(`   - Moduli: ${stats.modules}`);
      console.log(`   - Aree didattiche: ${stats.teachingAreas.join(', ')}`);
      
      // Mostra esempio di conversione
      if (modules.length > 0) {
        const sample = modules[0];
        console.log('\n📝 Esempio modulo convertito:');
        console.log(`   - Codice: ${sample.code}`);
        console.log(`   - Titolo: ${sample.title}`);
        console.log(`   - Area: ${sample.teachingArea}`);
        console.log(`   - Content Path: ${sample.contentPath}`);
      }
      
      return {
        levels: stats.levels,
        modules: stats.modules,
        teachingAreas: stats.teachingAreas,
        sampleModule: modules[0] || null
      };
    } catch (error) {
      console.error('❌ Errore test struttura modulare:', error);
      throw error;
    }
  },

  // Utility per verifica migrazione
  async checkMigration() {
    console.log('🔄 Verifica migrazione a struttura modulare');
    
    try {
      const compatibility = await LevelMigrationManager.checkCompatibility();
      const migrationNeeded = await LevelMigrationManager.needsLevelMigration();
      
      console.log('📋 Risultato verifica:');
      console.log(`   - Migrazione raccomandata: ${migrationNeeded ? 'SI' : 'NO'}`);
      console.log(`   - Può migrare: ${compatibility.compatibility.canMigrate ? 'SI' : 'NO'}`);
      console.log(`   - Perdita dati: ${compatibility.compatibility.dataLoss ? 'SI' : 'NO'}`);
      console.log(`   - Nuovi moduli: ${compatibility.compatibility.newModules}`);
      
      if (compatibility.compatibility.dataLoss) {
        console.log(`\n⚠️  Attenzione: ${compatibility.details.comparison.uniqueToCurrentCodes.length} moduli esistenti non presenti nella nuova struttura`);
      }
      
      return compatibility;
    } catch (error) {
      console.error('❌ Errore verifica migrazione:', error);
      throw error;
    }
  },

  // Utility per setup pulito con struttura modulare
  async cleanSetup() {
    console.log('🧹 Setup pulito con struttura modulare');
    
    try {
      // Cancella tutti i dati esistenti
      await db.delete();
      await db.open();
      
      console.log('🗑️ Database pulito, caricamento struttura modulare...');
      
      // Carica struttura modulare
      await LevelDataLoader.loadAllLevels();
      const modules = LevelDataLoader.getAllModules();
      
      // Importa moduli
      await ModuleManager.bulkImportModules(modules);
      console.log(`✅ Importati ${modules.length} moduli dalla struttura modulare`);
      
      // Crea dipendenze
      const dbModules = await db.modules.toArray();
      const moduleMap = new Map(dbModules.map(m => [m.code, m.id]));
      
      let dependencyCount = 0;
      for (const module of modules) {
        if (module.prerequisites && module.prerequisites.length > 0) {
          for (const prereqCode of module.prerequisites) {
            const moduleId = moduleMap.get(module.code);
            const prerequisiteId = moduleMap.get(prereqCode);
            
            if (moduleId && prerequisiteId) {
              await DependencyManager.addDependency(moduleId, prerequisiteId, 'mandatory');
              dependencyCount++;
            }
          }
        }
      }
      
      console.log(`✅ Create ${dependencyCount} dipendenze`);
      
      // Mostra statistiche
      const stats = LevelDataLoader.getStats();
      console.log('\n📊 SETUP COMPLETATO');
      console.log('===================');
      console.log(`Livelli: ${stats.levels}`);
      console.log(`Moduli: ${stats.modules}`);
      console.log(`Aree didattiche: ${stats.teachingAreas.join(', ')}`);
      console.log('===================\n');
      
      return {
        success: true,
        modules: modules.length,
        dependencies: dependencyCount,
        levels: stats.levels
      };
      
    } catch (error) {
      console.error('❌ Errore setup pulito:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Utility per verifica stato corrente
  async checkStatus() {
    console.log('📋 Verifica stato corrente');
    
    try {
      const moduleCount = await db.modules.count();
      const progressCount = await db.progress.count();
      const assessmentCount = await db.assessments.count();
      const dependencyCount = await db.dependencies.count();
      
      console.log('📊 STATO DATABASE:');
      console.log(`   - Moduli: ${moduleCount}`);
      console.log(`   - Progressi: ${progressCount}`);
      console.log(`   - Valutazioni: ${assessmentCount}`);
      console.log(`   - Dipendenze: ${dependencyCount}`);
      
      // Verifica se i dati provengono da struttura modulare
      const modules = await db.modules.toArray();
      const modularModules = modules.filter(m => m.code && m.code.includes('BIKE-'));
      const oldModules = modules.filter(m => m.code && m.code.includes('BIKE-0'));
      
      console.log('\n📚 TIPOLOGIA MODULI:');
      console.log(`   - Moduli struttura modulare: ${modularModules.length}`);
      console.log(`   - Moduli schema vecchio: ${oldModules.length}`);
      
      return {
        moduleCount,
        progressCount,
        assessmentCount,
        dependencyCount,
        modularModules: modularModules.length,
        oldModules: oldModules.length
      };
      
    } catch (error) {
      console.error('❌ Errore verifica stato:', error);
      throw error;
    }
  }
};

// Avvia applicazione quando DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

