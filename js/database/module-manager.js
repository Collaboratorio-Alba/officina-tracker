/**
 * Module Manager
 * Gestione CRUD per i moduli formativi
 */

import db from './db-config.js';

class ModuleManager {
  constructor() {
    this.db = db;
  }
  
  /**
   * Aggiunge un nuovo modulo
   * @param {Object} moduleData - Dati del modulo
   * @returns {Promise<number>} ID del modulo creato
   */
  async addModule(moduleData) {
    try {
      // Valida dati obbligatori
      if (!moduleData.title || !moduleData.code) {
        throw new Error('Titolo e codice sono obbligatori');
      }
      
      // Genera slug se non presente
      if (!moduleData.slug) {
        moduleData.slug = this.generateSlug(moduleData.title);
      }
      
      // Aggiungi timestamp
      moduleData.createdAt = new Date().toISOString();
      moduleData.updatedAt = new Date().toISOString();
      
      const id = await this.db.modules.add(moduleData);
      console.log(`✅ Modulo creato: ${moduleData.title} (ID: ${id})`);
      
      return id;
    } catch (error) {
      console.error('❌ Errore creazione modulo:', error);
      throw error;
    }
  }
  
  /**
   * Recupera un modulo per ID
   * @param {number} id - ID del modulo
   * @returns {Promise<Object|undefined>}
   */
  async getModule(id) {
    try {
      return await this.db.modules.get(id);
    } catch (error) {
      console.error('❌ Errore recupero modulo:', error);
      throw error;
    }
  }
  
  /**
   * Recupera un modulo per slug
   * @param {string} slug - Slug del modulo
   * @returns {Promise<Object|undefined>}
   */
  async getModuleBySlug(slug) {
    try {
      return await this.db.modules.where('slug').equals(slug).first();
    } catch (error) {
      console.error('❌ Errore recupero modulo per slug:', error);
      throw error;
    }
  }
  
  /**
   * Aggiorna un modulo esistente
   * @param {number} id - ID del modulo
   * @param {Object} changes - Modifiche da applicare
   * @returns {Promise<number>} Numero di record aggiornati
   */
  async updateModule(id, changes) {
    try {
      changes.updatedAt = new Date().toISOString();
      
      const updated = await this.db.modules.update(id, changes);
      
      if (updated) {
        console.log(`✅ Modulo aggiornato: ID ${id}`);
      } else {
        console.warn(`⚠️ Modulo non trovato: ID ${id}`);
      }
      
      return updated;
    } catch (error) {
      console.error('❌ Errore aggiornamento modulo:', error);
      throw error;
    }
  }
  
  /**
   * Elimina un modulo
   * @param {number} id - ID del modulo
   * @returns {Promise<void>}
   */
  async deleteModule(id) {
    try {
      // Verifica se ci sono dipendenze
      const dependents = await this.db.dependencies
        .where('prerequisiteId').equals(id)
        .toArray();
      
      if (dependents.length > 0) {
        throw new Error(
          `Impossibile eliminare: ${dependents.length} moduli dipendono da questo`
        );
      }
      
      // Elimina dipendenze del modulo
      await this.db.dependencies
        .where('moduleId').equals(id)
        .delete();
      
      // Elimina progressi associati
      await this.db.progress
        .where('moduleId').equals(id)
        .delete();
      
      // Elimina il modulo
      await this.db.modules.delete(id);
      
      console.log(`✅ Modulo eliminato: ID ${id}`);
    } catch (error) {
      console.error('❌ Errore eliminazione modulo:', error);
      throw error;
    }
  }
  
  /**
   * Recupera tutti i moduli
   * @returns {Promise<Array>}
   */
  async getAllModules() {
    try {
      return await this.db.modules.toArray();
    } catch (error) {
      console.error('❌ Errore recupero moduli:', error);
      throw error;
    }
  }
  
  /**
   * Recupera moduli per categoria
   * @param {string} category - Nome categoria
   * @returns {Promise<Array>}
   */
  async getModulesByCategory(category) {
    try {
      return await this.db.modules
        .where('category').equals(category)
        .toArray();
    } catch (error) {
      console.error('❌ Errore recupero moduli per categoria:', error);
      throw error;
    }
  }
  
  /**
   * Cerca moduli per testo
   * @param {string} query - Testo da cercare
   * @returns {Promise<Array>}
   */
  async searchModules(query) {
    try {
      const lowerQuery = query.toLowerCase();
      const allModules = await this.db.modules.toArray();
      
      return allModules.filter(m => 
        m.title.toLowerCase().includes(lowerQuery) ||
        m.code.toLowerCase().includes(lowerQuery) ||
        (m.description && m.description.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('❌ Errore ricerca moduli:', error);
      throw error;
    }
  }
  
  /**
   * Conta moduli per stato
   * @returns {Promise<Object>}
   */
  async getModuleStats() {
    try {
      const modules = await this.db.modules.toArray();
      const progressRecords = await this.db.progress.toArray();
      
      const progressMap = new Map(
        progressRecords.map(p => [p.moduleId, p.status])
      );
      
      const stats = {
        total: modules.length,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        byCategory: {}
      };
      
      modules.forEach(m => {
        const status = progressMap.get(m.id) || 'not-started';
        
        if (status === 'completed') {
          stats.completed++;
        } else if (status === 'in-progress') {
          stats.inProgress++;
        } else {
          stats.notStarted++;
        }
        
        // Conta per categoria
        if (!stats.byCategory[m.category]) {
          stats.byCategory[m.category] = 0;
        }
        stats.byCategory[m.category]++;
      });
      
      stats.completionPercentage = stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;
      
      return stats;
    } catch (error) {
      console.error('❌ Errore calcolo statistiche:', error);
      throw error;
    }
  }
  
  /**
   * Genera slug da titolo
   * @param {string} title - Titolo del modulo
   * @returns {string}
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Rimuovi accenti
      .replace(/[^a-z0-9]+/g, '-')     // Sostituisci non-alfanumerici con -
      .replace(/^-+|-+$/g, '');        // Rimuovi - iniziali/finali
  }
  
  /**
   * Importa moduli in bulk
   * @param {Array} modules - Array di moduli da importare
   * @returns {Promise<number>} Numero di moduli importati
   */
  async bulkImportModules(modules) {
    try {
      const processedModules = modules.map(m => ({
        ...m,
        slug: m.slug || this.generateSlug(m.title),
        createdAt: m.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const lastKey = await this.db.modules.bulkAdd(processedModules);
      console.log(`✅ Importati ${modules.length} moduli`);
      
      return modules.length;
    } catch (error) {
      console.error('❌ Errore import bulk moduli:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ModuleManager();

