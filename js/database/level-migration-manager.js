/**
 * Level Migration Manager
 * Gestione migrazione da struttura monolitica a struttura modulare a livelli
 */

import db from './db-config.js';
import ModuleManager from './module-manager.js';
import DependencyManager from './dependency-manager.js';
import LevelDataLoader from '../data/level-data-loader.js';

class LevelMigrationManager {
  constructor() {
    this.db = db;
  }

  /**
   * Verifica se è necessaria migrazione a struttura modulare
   * @returns {Promise<boolean>}
   */
  async needsLevelMigration() {
    try {
      // Controlla se esistono moduli con codici vecchi (BIKE-001, BIKE-002, etc.)
      const modules = await this.db.modules.toArray();
      const oldStyleModules = modules.filter(m => m.code && m.code.startsWith('BIKE-') && m.code.length === 8);
      
      // Se ci sono moduli con codici vecchi, suggeriamo migrazione
      return oldStyleModules.length > 0;
    } catch (error) {
      console.error('❌ Errore verifica migrazione livelli:', error);
      return false;
    }
  }

  /**
   * Esegue migrazione completa a struttura modulare
   * @returns {Promise<Object>}
   */
  async migrateToLevelStructure() {
    try {
      console.log('🔄 Inizio migrazione a struttura modulare...');
      
      // Carica struttura modulare
      await LevelDataLoader.loadAllLevels();
      
      if (!LevelDataLoader.isLoaded()) {
        throw new Error('Impossibile caricare struttura modulare');
      }

      // Backup statistiche pre-migrazione
      const preMigrationStats = await this.getMigrationStats();
      
      // Pulisci database esistente (opzionale - potrebbe essere troppo drastico)
      // await this.cleanDatabase();
      
      // Importa moduli dalla struttura modulare
      const modules = LevelDataLoader.getAllModules();
      await ModuleManager.bulkImportModules(modules);
      
      // Crea dipendenze
      const dependencyCount = await this.createLevelDependencies(modules);
      
      // Statistiche post-migrazione
      const postMigrationStats = await this.getMigrationStats();
      const migrationStats = LevelDataLoader.getStats();
      
      console.log('✅ Migrazione a struttura modulare completata');
      
      return {
        success: true,
        preMigration: preMigrationStats,
        postMigration: postMigrationStats,
        levelStructure: migrationStats,
        modulesImported: modules.length,
        dependenciesCreated: dependencyCount
      };
      
    } catch (error) {
      console.error('❌ Errore migrazione a struttura modulare:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Crea dipendenze per la struttura modulare
   * @param {Array} modules 
   * @returns {Promise<number>}
   */
  async createLevelDependencies(modules) {
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
            } else {
              console.warn(`⚠️ Dipendenza non creata: ${module.code} -> ${prereqCode}`);
            }
          }
        }
      }
      
      console.log(`✅ Create ${dependencyCount} dipendenze per struttura modulare`);
      return dependencyCount;
      
    } catch (error) {
      console.error('❌ Errore creazione dipendenze:', error);
      throw error;
    }
  }

  /**
   * Pulisce database (opzionale - usare con cautela)
   * @returns {Promise<void>}
   */
  async cleanDatabase() {
    try {
      console.log('🧹 Pulizia database...');
      
      await this.db.modules.clear();
      await this.db.dependencies.clear();
      await this.db.progress.clear();
      
      console.log('✅ Database pulito');
    } catch (error) {
      console.error('❌ Errore pulizia database:', error);
      throw error;
    }
  }

  /**
   * Recupera statistiche migrazione
   * @returns {Promise<Object>}
   */
  async getMigrationStats() {
    try {
      const modules = await this.db.modules.toArray();
      const dependencies = await this.db.dependencies.toArray();
      const progress = await this.db.progress.toArray();
      
      // Analizza codici modulo per capire struttura
      const moduleCodes = modules.map(m => m.code);
      const oldStyleModules = moduleCodes.filter(code => code.startsWith('BIKE-') && code.length === 8);
      const newStyleModules = moduleCodes.filter(code => code.includes('.'));
      
      return {
        totalModules: modules.length,
        oldStyleModules: oldStyleModules.length,
        newStyleModules: newStyleModules.length,
        dependencies: dependencies.length,
        progressRecords: progress.length,
        moduleCodes: moduleCodes
      };
    } catch (error) {
      console.error('❌ Errore recupero statistiche migrazione:', error);
      return {
        totalModules: 0,
        oldStyleModules: 0,
        newStyleModules: 0,
        dependencies: 0,
        progressRecords: 0,
        moduleCodes: []
      };
    }
  }

  /**
   * Confronta strutture dati vecchia vs nuova
   * @returns {Promise<Object>}
   */
  async compareStructures() {
    try {
      // Carica struttura modulare
      await LevelDataLoader.loadAllLevels();
      const levelModules = LevelDataLoader.getAllModules();
      const levelStats = LevelDataLoader.getStats();
      
      // Recupera moduli attuali
      const currentModules = await this.db.modules.toArray();
      
      // Analizza sovrapposizioni
      const currentCodes = new Set(currentModules.map(m => m.code));
      const levelCodes = new Set(levelModules.map(m => m.code));
      
      const commonCodes = [...currentCodes].filter(code => levelCodes.has(code));
      const uniqueToCurrent = [...currentCodes].filter(code => !levelCodes.has(code));
      const uniqueToLevel = [...levelCodes].filter(code => !currentCodes.has(code));
      
      return {
        currentStructure: {
          total: currentModules.length,
          codes: [...currentCodes]
        },
        levelStructure: {
          total: levelModules.length,
          levels: levelStats.levels,
          teachingAreas: levelStats.teachingAreas,
          codes: [...levelCodes]
        },
        comparison: {
          common: commonCodes.length,
          uniqueToCurrent: uniqueToCurrent.length,
          uniqueToLevel: uniqueToLevel.length,
          commonCodes,
          uniqueToCurrentCodes: uniqueToCurrent,
          uniqueToLevelCodes: uniqueToLevel
        }
      };
    } catch (error) {
      console.error('❌ Errore confronto strutture:', error);
      throw error;
    }
  }

  /**
   * Verifica compatibilità struttura modulare
   * @returns {Promise<Object>}
   */
  async checkCompatibility() {
    try {
      const comparison = await this.compareStructures();
      const migrationNeeded = await this.needsLevelMigration();
      
      return {
        migrationRecommended: migrationNeeded,
        compatibility: {
          canMigrate: comparison.comparison.uniqueToCurrent.length === 0,
          dataLoss: comparison.comparison.uniqueToCurrent.length > 0,
          newModules: comparison.comparison.uniqueToLevel.length
        },
        details: comparison
      };
    } catch (error) {
      console.error('❌ Errore verifica compatibilità:', error);
      throw error;
    }
  }

  /**
   * Esegue migrazione incrementale (mantiene dati esistenti)
   * @returns {Promise<Object>}
   */
  async incrementalMigration() {
    try {
      console.log('🔄 Migrazione incrementale a struttura modulare...');
      
      // Carica struttura modulare
      await LevelDataLoader.loadAllLevels();
      const levelModules = LevelDataLoader.getAllModules();
      
      // Recupera moduli attuali
      const currentModules = await this.db.modules.toArray();
      const currentCodes = new Set(currentModules.map(m => m.code));
      
      // Filtra moduli nuovi (non presenti nel database)
      const newModules = levelModules.filter(m => !currentCodes.has(m.code));
      
      if (newModules.length === 0) {
        console.log('ℹ️  Nessun nuovo modulo da importare');
        return {
          success: true,
          modulesImported: 0,
          message: 'Struttura già aggiornata'
        };
      }
      
      // Importa solo moduli nuovi
      await ModuleManager.bulkImportModules(newModules);
      
      // Crea dipendenze per i nuovi moduli
      const dependencyCount = await this.createLevelDependencies(newModules);
      
      console.log(`✅ Migrazione incrementale completata: ${newModules.length} nuovi moduli`);
      
      return {
        success: true,
        modulesImported: newModules.length,
        dependenciesCreated: dependencyCount,
        newModuleCodes: newModules.map(m => m.code)
      };
      
    } catch (error) {
      console.error('❌ Errore migrazione incrementale:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new LevelMigrationManager();