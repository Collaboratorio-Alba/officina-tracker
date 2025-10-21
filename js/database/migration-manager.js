/**
 * Migration Manager
 * Gestione migrazione dati da schema 1.0.0 a 1.1.0
 */

import db from './db-config.js';
import ModuleManager from './module-manager.js';
import DependencyManager from './dependency-manager.js';

class MigrationManager {
  constructor() {
    this.db = db;
  }

  /**
   * Esegue migrazione completa da schema vecchio a nuovo
   * @returns {Promise<Object>} Risultato migrazione
   */
  async migrateToExtendedSchema() {
    console.log('🔄 Inizio migrazione a schema esteso...');
    
    try {
      const result = {
        modulesMigrated: 0,
        dependenciesMigrated: 0,
        errors: []
      };

      // 1. Carica dati estesi
      const extendedModulesResponse = await fetch('./js/data/modules-extended.json');
      const extendedData = await extendedModulesResponse.json();
      
      const courseStructureResponse = await fetch('./js/data/courses-structure-extended.json');
      const courseData = await courseStructureResponse.json();

      // 2. Pulisci database esistente
      await this.cleanDatabase();
      console.log('✅ Database pulito');

      // 3. Importa moduli estesi
      result.modulesMigrated = await ModuleManager.bulkImportModules(extendedData.modules);
      console.log(`✅ Importati ${result.modulesMigrated} moduli estesi`);

      // 4. Crea dipendenze dai dati estesi
      const modules = await db.modules.toArray();
      const moduleMap = new Map(modules.map(m => [m.code, m.id]));

      let dependencyCount = 0;
      for (const module of extendedData.modules) {
        if (module.prerequisites && module.prerequisites.length > 0) {
          for (const prereqCode of module.prerequisites) {
            const moduleId = moduleMap.get(module.code);
            const prerequisiteId = moduleMap.get(prereqCode);
            
            if (moduleId && prerequisiteId) {
              await DependencyManager.addDependency(moduleId, prerequisiteId, 'mandatory');
              dependencyCount++;
            } else {
              result.errors.push(`Dipendenza non creata: ${module.code} -> ${prereqCode}`);
            }
          }
        }
      }

      result.dependenciesMigrated = dependencyCount;
      console.log(`✅ Create ${dependencyCount} dipendenze`);

      // 5. Verifica integrità migrazione
      await this.verifyMigration(extendedData.modules.length, dependencyCount);

      console.log('✅ Migrazione completata con successo!');
      return result;

    } catch (error) {
      console.error('❌ Errore durante la migrazione:', error);
      throw error;
    }
  }

  /**
   * Pulisce il database esistente
   */
  async cleanDatabase() {
    try {
      await this.db.modules.clear();
      await this.db.dependencies.clear();
      await this.db.progress.clear();
      await this.db.assessments.clear();
    } catch (error) {
      console.error('❌ Errore pulizia database:', error);
      throw error;
    }
  }

  /**
   * Verifica integrità migrazione
   */
  async verifyMigration(expectedModules, expectedDependencies) {
    const actualModules = await this.db.modules.count();
    const actualDependencies = await this.db.dependencies.count();

    if (actualModules !== expectedModules) {
      throw new Error(`Verifica fallita: ${actualModules} moduli invece di ${expectedModules}`);
    }

    if (actualDependencies !== expectedDependencies) {
      console.warn(`⚠️ Dipendenze: ${actualDependencies} invece di ${expectedDependencies}`);
    }

    // Verifica campi obbligatori
    const modules = await this.db.modules.toArray();
    for (const module of modules) {
      if (!module.contentPath) {
        throw new Error(`Modulo ${module.code} senza contentPath`);
      }
      if (!module.skillTags) {
        console.warn(`⚠️ Modulo ${module.code} senza skillTags`);
      }
    }

    console.log('✅ Verifica migrazione completata');
  }

  /**
   * Controlla se è necessaria migrazione
   */
  async needsMigration() {
    try {
      const modules = await this.db.modules.toArray();
      
      if (modules.length === 0) {
        return false; // Database vuoto, non serve migrazione
      }

      // Controlla se qualche modulo ha i nuovi campi
      const hasNewFields = modules.some(m => 
        m.contentPath || m.skillTags || m.revisionDate
      );

      return !hasNewFields;
    } catch (error) {
      console.error('❌ Errore verifica migrazione:', error);
      return false;
    }
  }

  /**
   * Backup dati esistenti
   */
  async backupExistingData() {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        modules: await this.db.modules.toArray(),
        dependencies: await this.db.dependencies.toArray(),
        progress: await this.db.progress.toArray(),
        assessments: await this.db.assessments.toArray()
      };

      // Salva backup localmente (per debug)
      const backupBlob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });
      
      const backupUrl = URL.createObjectURL(backupBlob);
      console.log(`📦 Backup creato: ${backupUrl}`);
      
      return backup;
    } catch (error) {
      console.error('❌ Errore backup:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new MigrationManager();