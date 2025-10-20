/**
 * Clean Setup Utility
 * Forza il caricamento della struttura modulare da zero
 */

import db from './database/db-config.js';
import LevelDataLoader from './data/level-data-loader.js';
import ModuleManager from './database/module-manager.js';
import DependencyManager from './database/dependency-manager.js';

class CleanSetup {
  constructor() {
    this.db = db;
  }

  /**
   * Esegue setup pulito con struttura modulare
   * @returns {Promise<Object>}
   */
  async executeCleanSetup() {
    try {
      console.log('🧹 ESECUZIONE SETUP PULITO');
      console.log('==========================');

      // 1. Pulisci database
      await this.cleanDatabase();
      
      // 2. Carica struttura modulare
      await LevelDataLoader.loadAllLevels();
      
      if (!LevelDataLoader.isLoaded()) {
        throw new Error('Impossibile caricare struttura modulare');
      }

      // 3. Importa moduli
      const modules = LevelDataLoader.getAllModules();
      await ModuleManager.bulkImportModules(modules);
      
      // 4. Crea dipendenze
      const dependencyCount = await this.createDependencies(modules);
      
      // 5. Statistiche finali
      const stats = LevelDataLoader.getStats();
      
      console.log('\n✅ SETUP PULITO COMPLETATO');
      console.log('==========================');
      console.log(`📚 Livelli caricati: ${stats.levels}`);
      console.log(`📝 Moduli importati: ${modules.length}`);
      console.log(`🔗 Dipendenze create: ${dependencyCount}`);
      console.log(`🎯 Aree didattiche: ${stats.teachingAreas.join(', ')}`);
      
      return {
        success: true,
        levels: stats.levels,
        modules: modules.length,
        dependencies: dependencyCount,
        teachingAreas: stats.teachingAreas
      };
      
    } catch (error) {
      console.error('❌ Errore setup pulito:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pulisce completamente il database
   * @returns {Promise<void>}
   */
  async cleanDatabase() {
    try {
      console.log('🧹 Pulizia database in corso...');
      
      await this.db.modules.clear();
      await this.db.dependencies.clear();
      await this.db.progress.clear();
      await this.db.assessments.clear();
      
      console.log('✅ Database pulito');
    } catch (error) {
      console.error('❌ Errore pulizia database:', error);
      throw error;
    }
  }

  /**
   * Crea tutte le dipendenze
   * @param {Array} modules 
   * @returns {Promise<number>}
   */
  async createDependencies(modules) {
    try {
      const dbModules = await this.db.modules.toArray();
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
      return dependencyCount;
      
    } catch (error) {
      console.error('❌ Errore creazione dipendenze:', error);
      throw error;
    }
  }

  /**
   * Verifica stato corrente del database
   * @returns {Promise<Object>}
   */
  async getCurrentStatus() {
    try {
      const modules = await this.db.modules.toArray();
      const dependencies = await this.db.dependencies.toArray();
      const progress = await this.db.progress.toArray();
      
      // Analizza tipi di moduli
      const oldStyle = modules.filter(m => m.code.startsWith('BIKE-') && m.code.length === 8);
      const newStyle = modules.filter(m => m.code.includes('.'));
      
      return {
        totalModules: modules.length,
        oldStyleModules: oldStyle.length,
        newStyleModules: newStyle.length,
        dependencies: dependencies.length,
        progressRecords: progress.length,
        needsCleanup: oldStyle.length > 0 || modules.length === 0
      };
    } catch (error) {
      console.error('❌ Errore verifica stato:', error);
      return {
        totalModules: 0,
        oldStyleModules: 0,
        newStyleModules: 0,
        dependencies: 0,
        progressRecords: 0,
        needsCleanup: true
      };
    }
  }

  /**
   * Confronta strutture vecchia vs nuova
   * @returns {Promise<Object>}
   */
  async compareStructures() {
    try {
      await LevelDataLoader.loadAllLevels();
      const levelModules = LevelDataLoader.getAllModules();
      const currentModules = await this.db.modules.toArray();
      
      const currentCodes = new Set(currentModules.map(m => m.code));
      const levelCodes = new Set(levelModules.map(m => m.code));
      
      return {
        current: {
          total: currentModules.length,
          codes: [...currentCodes]
        },
        modular: {
          total: levelModules.length,
          levels: LevelDataLoader.getStats().levels,
          codes: [...levelCodes]
        },
        differences: {
          common: [...currentCodes].filter(code => levelCodes.has(code)).length,
          uniqueToCurrent: [...currentCodes].filter(code => !levelCodes.has(code)).length,
          uniqueToModular: [...levelCodes].filter(code => !currentCodes.has(code)).length
        }
      };
    } catch (error) {
      console.error('❌ Errore confronto strutture:', error);
      throw error;
    }
  }
}

// Crea istanza globale
window.CleanSetup = new CleanSetup();

// Comandi rapidi da console
window.cleanSetup = async () => {
  return await window.CleanSetup.executeCleanSetup();
};

window.checkStatus = async () => {
  return await window.CleanSetup.getCurrentStatus();
};

window.compareData = async () => {
  return await window.CleanSetup.compareStructures();
};

export default CleanSetup;