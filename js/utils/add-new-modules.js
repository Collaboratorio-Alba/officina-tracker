/**
 * Add New Modules Utility
 * Utility per aggiungere nuovi moduli senza cancellare progressi esistenti
 */

import ModuleManager from '../database/module-manager.js';
import DependencyManager from '../database/dependency-manager.js';
import LevelDataLoader from '../data/level-data-loader.js';

class AddNewModules {
  constructor() {
    this.moduleManager = ModuleManager;
    this.dependencyManager = DependencyManager;
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
      
      // Crea dipendenze per i nuovi moduli
      const dependencyCount = await this.createDependenciesForNewModules(addedModules, dbModules);
      
      return {
        success: true,
        message: `✅ Aggiunti ${addedModules.length} nuovi moduli e ${dependencyCount} dipendenze`,
        added: addedModules.length,
        dependencies: dependencyCount,
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

  /**
   * Crea dipendenze per i nuovi moduli aggiunti
   * @param {Array} addedModules - Moduli appena aggiunti
   * @param {Array} existingModules - Moduli esistenti nel database
   * @returns {Promise<number>} Numero di dipendenze create
   */
  async createDependenciesForNewModules(addedModules, existingModules) {
    try {
      console.log('🔗 Creazione dipendenze per nuovi moduli...');
      
      // Carica tutti i moduli dalla struttura a livelli per ottenere le dipendenze
      await this.levelLoader.loadAllLevels();
      const allLevelModules = this.levelLoader.getAllModules();
      
      // Crea mappa per ricerca rapida
      const moduleMap = new Map();
      [...existingModules, ...addedModules].forEach(m => {
        moduleMap.set(m.code, m.id);
      });
      
      let dependencyCount = 0;
      
      // Per ogni modulo aggiunto, crea le sue dipendenze
      for (const addedModule of addedModules) {
        const levelModule = allLevelModules.find(m => m.code === addedModule.code);
        
        if (levelModule && levelModule.prerequisites && levelModule.prerequisites.length > 0) {
          console.log(`🔗 Creando dipendenze per ${addedModule.code}: ${levelModule.prerequisites.length} prerequisiti`);
          
          for (const prereqCode of levelModule.prerequisites) {
            const moduleId = addedModule.id;
            const prerequisiteId = moduleMap.get(prereqCode);
            
            if (moduleId && prerequisiteId) {
              try {
                await this.dependencyManager.addDependency(moduleId, prerequisiteId, 'mandatory');
                dependencyCount++;
                console.log(`✅ Dipendenza creata: ${prereqCode} → ${addedModule.code}`);
              } catch (error) {
                console.warn(`⚠️ Errore creazione dipendenza ${prereqCode} → ${addedModule.code}:`, error.message);
              }
            } else {
              console.warn(`⚠️ Impossibile creare dipendenza: ${prereqCode} → ${addedModule.code} (modulo prerequisito non trovato)`);
            }
          }
        }
      }
      
      console.log(`✅ Create ${dependencyCount} dipendenze per nuovi moduli`);
      return dependencyCount;
      
    } catch (error) {
      console.error('❌ Errore creazione dipendenze:', error);
      return 0;
    }
  }

  /**
   * Fissa dipendenze mancanti per moduli esistenti
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async fixMissingDependencies() {
    try {
      console.log('🔧 Fissaggio dipendenze mancanti...');
      
      // Carica tutti i moduli dalla struttura a livelli
      await this.levelLoader.loadAllLevels();
      const allLevelModules = this.levelLoader.getAllModules();
      
      // Recupera moduli attualmente nel database
      const dbModules = await this.moduleManager.getAllModules();
      const moduleMap = new Map(dbModules.map(m => [m.code, m.id]));
      
      let fixedCount = 0;
      let errorCount = 0;
      
      // Per ogni modulo nel database, verifica e crea dipendenze mancanti
      for (const dbModule of dbModules) {
        const levelModule = allLevelModules.find(m => m.code === dbModule.code);
        
        if (levelModule && levelModule.prerequisites && levelModule.prerequisites.length > 0) {
          // Verifica quali dipendenze esistono già
          const existingDeps = await this.dependencyManager.getPrerequisites(dbModule.id);
          const existingPrereqCodes = new Set(existingDeps.map(d => d.code));
          
          // Crea dipendenze mancanti
          for (const prereqCode of levelModule.prerequisites) {
            if (!existingPrereqCodes.has(prereqCode)) {
              const prerequisiteId = moduleMap.get(prereqCode);
              
              if (prerequisiteId) {
                try {
                  await this.dependencyManager.addDependency(dbModule.id, prerequisiteId, 'mandatory');
                  fixedCount++;
                  console.log(`✅ Dipendenza fissata: ${prereqCode} → ${dbModule.code}`);
                } catch (error) {
                  console.warn(`⚠️ Errore fissaggio dipendenza ${prereqCode} → ${dbModule.code}:`, error.message);
                  errorCount++;
                }
              } else {
                console.warn(`⚠️ Impossibile fissare dipendenza: ${prereqCode} → ${dbModule.code} (modulo prerequisito non trovato)`);
                errorCount++;
              }
            }
          }
        }
      }
      
      const message = fixedCount > 0
        ? `✅ Fissate ${fixedCount} dipendenze mancanti${errorCount > 0 ? `, ${errorCount} errori` : ''}`
        : 'ℹ️ Nessuna dipendenza mancante da fissare';
      
      return {
        success: true,
        message,
        fixed: fixedCount,
        errors: errorCount
      };
      
    } catch (error) {
      console.error('❌ Errore fissaggio dipendenze:', error);
      return {
        success: false,
        message: `❌ Errore: ${error.message}`,
        fixed: 0,
        errors: 0
      };
    }
  }
}

// Export singleton instance
export default new AddNewModules();