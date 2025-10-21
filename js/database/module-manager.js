/**
 * Module Manager
 * Gestione CRUD per i moduli formativi (schema esteso 1.1.0)
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
   * Importa moduli in bulk (schema esteso)
   * @param {Array} modules - Array di moduli da importare
   * @returns {Promise<number>} Numero di moduli importati
   */
  async bulkImportModules(modules) {
    try {
      const processedModules = modules.map(m => ({
        ...m,
        slug: m.slug || this.generateSlug(m.title),
        contentPath: m.contentPath || this.generateContentPath(m),
        skillTags: m.skillTags || [],
        revisionDate: m.revisionDate || new Date().toISOString().split('T')[0],
        createdAt: m.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const lastKey = await this.db.modules.bulkAdd(processedModules);
      console.log(`✅ Importati ${modules.length} moduli (schema esteso)`);
      
      return modules.length;
    } catch (error) {
      console.error('❌ Errore import bulk moduli:', error);
      throw error;
    }
  }

  /**
   * Recupera moduli per skill tag
   * @param {string} skillTag - Tag da cercare
   * @returns {Promise<Array>}
   */
  async getModulesBySkillTag(skillTag) {
    try {
      const allModules = await this.db.modules.toArray();
      return allModules.filter(m =>
        m.skillTags && m.skillTags.includes(skillTag)
      );
    } catch (error) {
      console.error('❌ Errore ricerca per skill tag:', error);
      throw error;
    }
  }

  /**
   * Recupera tutti gli skill tags unici
   * @returns {Promise<Array>}
   */
  async getAllSkillTags() {
    try {
      const modules = await this.db.modules.toArray();
      const allTags = modules.flatMap(m => m.skillTags || []);
      return [...new Set(allTags)].sort();
    } catch (error) {
      console.error('❌ Errore recupero skill tags:', error);
      throw error;
    }
  }

  /**
   * Recupera moduli per content path
   * @param {string} contentPath - Path del contenuto
   * @returns {Promise<Object|undefined>}
   */
  async getModuleByContentPath(contentPath) {
    try {
      return await this.db.modules
        .where('contentPath')
        .equals(contentPath)
        .first();
    } catch (error) {
      console.error('❌ Errore recupero modulo per content path:', error);
      throw error;
    }
  }

  /**
   * Recupera moduli che necessitano revisione
   * @param {number} daysThreshold - Soglia giorni per revisione
   * @returns {Promise<Array>}
   */
  async getModulesNeedingRevision(daysThreshold = 365) {
    try {
      const modules = await this.db.modules.toArray();
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
      
      return modules.filter(m => {
        if (!m.revisionDate) return true;
        const revisionDate = new Date(m.revisionDate);
        return revisionDate < thresholdDate;
      });
    } catch (error) {
      console.error('❌ Errore recupero moduli da revisionare:', error);
      throw error;
    }
  }

  /**
   * Genera content path automatico per Typemill
   * @param {Object} module - Dati modulo
   * @returns {string}
   */
  generateContentPath(module) {
    const courseSlug = 'ciclofficina-basics';
    const areaSlug = module.teachingArea
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const moduleSlug = module.slug || this.generateSlug(module.title);
    
    return `/${courseSlug}/${areaSlug}/${moduleSlug}`;
  }

  /**
   * Aggiorna revision date di un modulo
   * @param {number} id - ID modulo
   * @param {string} date - Data revisione (YYYY-MM-DD)
   * @returns {Promise<number>}
   */
  async updateRevisionDate(id, date = null) {
    try {
      const revisionDate = date || new Date().toISOString().split('T')[0];
      return await this.updateModule(id, { revisionDate });
    } catch (error) {
      console.error('❌ Errore aggiornamento revision date:', error);
      throw error;
    }
  }

  /**
   * Aggiunge skill tag a un modulo
   * @param {number} id - ID modulo
   * @param {string} tag - Tag da aggiungere
   * @returns {Promise<number>}
   */
  async addSkillTag(id, tag) {
    try {
      const module = await this.getModule(id);
      if (!module) {
        throw new Error('Modulo non trovato');
      }

      const currentTags = module.skillTags || [];
      if (!currentTags.includes(tag)) {
        const updatedTags = [...currentTags, tag];
        return await this.updateModule(id, { skillTags: updatedTags });
      }

      return 0; // Tag già presente
    } catch (error) {
      console.error('❌ Errore aggiunta skill tag:', error);
      throw error;
    }
  }

  /**
   * Rimuove skill tag da un modulo
   * @param {number} id - ID modulo
   * @param {string} tag - Tag da rimuovere
   * @returns {Promise<number>}
   */
  async removeSkillTag(id, tag) {
    try {
      const module = await this.getModule(id);
      if (!module) {
        throw new Error('Modulo non trovato');
      }

      const currentTags = module.skillTags || [];
      const updatedTags = currentTags.filter(t => t !== tag);
      
      if (updatedTags.length !== currentTags.length) {
        return await this.updateModule(id, { skillTags: updatedTags });
      }

      return 0; // Tag non presente
    } catch (error) {
      console.error('❌ Errore rimozione skill tag:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ModuleManager();

