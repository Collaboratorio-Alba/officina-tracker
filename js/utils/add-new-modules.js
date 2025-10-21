/**
 * Add New Modules Utility
 * Utility per aggiungere nuovi moduli senza cancellare progressi esistenti
 */

import ModuleManager from '../database/module-manager.js';
import LevelDataLoader from '../data/level-data-loader.js';

class AddNewModules {
  constructor() {
    this.moduleManager = ModuleManager;
    this.levelLoader = LevelDataLoader;
  }

  /**
   * Aggiunge solo i nuovi moduli mancanti al database
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async addMissingModules() {
    try {
      console.log('🔍 Controllo moduli mancanti nel database...');
      
      // Carica tutti i moduli dalla struttura a livelli
      await this.levelLoader.loadAllLevels();
      const allModules = this.levelLoader.getAllModules();
      
      // Recupera moduli attualmente nel database
      const dbModules = await this.moduleManager.getAllModules();
      const dbModuleCodes = new Set(dbModules.map(m => m.code));
      
      // Identifica moduli mancanti
      const missingModules = allModules.filter(module => 
        !dbModuleCodes.has(module.code)
      );
      
      console.log(`📊 Moduli totali: ${allModules.length}`);
      console.log(`📊 Moduli nel database: ${dbModules.length}`);
      console.log(`📊 Moduli mancanti: ${missingModules.length}`);
      
      if (missingModules.length === 0) {
        return {
          success: true,
          message: '✅ Tutti i moduli sono già presenti nel database',
          added: 0,
          modules: []
        };
      }
      
      // Aggiungi solo i moduli mancanti
      const addedModules = [];
      for (const module of missingModules) {
        try {
          const moduleId = await this.moduleManager.addModule(module);
          addedModules.push({
            id: moduleId,
            code: module.code,
            title: module.title
          });
          console.log(`✅ Aggiunto modulo: ${module.code} - ${module.title}`);
        } catch (error) {
          console.warn(`⚠️ Errore aggiunta modulo ${module.code}:`, error.message);
        }
      }
      
      return {
        success: true,
        message: `✅ Aggiunti ${addedModules.length} nuovi moduli`,
        added: addedModules.length,
        modules: addedModules
      };
      
    } catch (error) {
      console.error('❌ Errore aggiunta moduli mancanti:', error);
      return {
        success: false,
        message: `❌ Errore: ${error.message}`,
        added: 0,
        modules: []
      };
    }
  }

  /**
   * Verifica se specifici moduli sono presenti nel database
   * @param {Array} moduleCodes - Codici dei moduli da verificare
   * @returns {Promise<Object>}
   */
  async checkModules(moduleCodes) {
    try {
      const dbModules = await this.moduleManager.getAllModules();
      const dbModuleCodes = new Set(dbModules.map(m => m.code));
      
      const results = {};
      moduleCodes.forEach(code => {
        results[code] = dbModuleCodes.has(code);
      });
      
      return {
        success: true,
        results: results,
        missing: moduleCodes.filter(code => !results[code])
      };
    } catch (error) {
      console.error('❌ Errore verifica moduli:', error);
      return {
        success: false,
        message: error.message,
        results: {}
      };
    }
  }

  /**
   * Aggiunge specifici moduli per ID
   * @param {Array} moduleIds - ID dei moduli da aggiungere
   * @returns {Promise<Object>}
   */
  async addSpecificModules(moduleIds) {
    try {
      await this.levelLoader.loadAllLevels();
      const allModules = this.levelLoader.getAllModules();
      
      const modulesToAdd = allModules.filter(module => 
        moduleIds.includes(module.code)
      );
      
      if (modulesToAdd.length === 0) {
        return {
          success: false,
          message: '❌ Nessuno dei moduli specificati trovato nella struttura',
          added: 0
        };
      }
      
      const addedModules = [];
      for (const module of modulesToAdd) {
        try {
          const moduleId = await this.moduleManager.addModule(module);
          addedModules.push({
            id: moduleId,
            code: module.code,
            title: module.title
          });
          console.log(`✅ Aggiunto modulo: ${module.code} - ${module.title}`);
        } catch (error) {
          console.warn(`⚠️ Errore aggiunta modulo ${module.code}:`, error.message);
        }
      }
      
      return {
        success: true,
        message: `✅ Aggiunti ${addedModules.length} moduli specifici`,
        added: addedModules.length,
        modules: addedModules
      };
      
    } catch (error) {
      console.error('❌ Errore aggiunta moduli specifici:', error);
      return {
        success: false,
        message: `❌ Errore: ${error.message}`,
        added: 0
      };
    }
  }
}

// Export singleton instance
export default new AddNewModules();