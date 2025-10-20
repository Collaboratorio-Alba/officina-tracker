/**
 * Progress Manager
 * Gestione del progresso utente nei moduli formativi (Schema Esteso 1.1.0)
 * Separazione netta tra contenuti (contentPath) e progressi
 */

import db from './db-config.js';

class ProgressManager {
  constructor() {
    this.db = db;
  }
  
  /**
   * Crea o aggiorna il progresso per un modulo
   * @param {number} moduleId - ID del modulo
   * @param {string} status - Stato ('not-started' | 'in-progress' | 'completed' | 'failed')
   * @param {Object} additionalData - Dati aggiuntivi (note, score, etc.)
   * @returns {Promise<number>} ID del record di progresso
   */
  async updateProgress(moduleId, statusOrData, additionalData = {}) {
    // Handle both parameter formats:
    // 1. updateProgress(moduleId, status, additionalData)
    // 2. updateProgress(moduleId, {status, completionDate, score, notes})
    
    let status;
    let data = {};
    
    if (typeof statusOrData === 'string') {
      // Format 1: separate parameters
      status = statusOrData;
      data = additionalData;
    } else if (typeof statusOrData === 'object') {
      // Format 2: object parameter
      status = statusOrData.status;
      data = statusOrData;
    } else {
      throw new Error('Invalid parameters for updateProgress');
    }
    try {
      // Verifica che il modulo esista
      const module = await this.db.modules.get(moduleId);
      if (!module) {
        throw new Error(`Modulo ${moduleId} non trovato`);
      }
      
      // Cerca progresso esistente
      const existing = await this.db.progress
        .where('moduleId').equals(moduleId)
        .first();
      
      const now = new Date().toISOString();
      
      if (existing) {
        // Aggiorna progresso esistente
        const updates = {
          status,
          ...data,
          updatedAt: now
        };
        
        // Se completato, aggiungi data completamento
        if (status === 'completed' && !existing.completionDate) {
          updates.completionDate = data.completionDate || now;
        }
        
        // Incrementa tentativi se fallito
        if (status === 'failed') {
          updates.attempts = (existing.attempts || 0) + 1;
        }
        
        await this.db.progress.update(existing.id, updates);
        console.log(`✅ Progresso aggiornato: ${module.title} → ${status}`);
        
        return existing.id;
      } else {
        // Crea nuovo progresso
        const progressData = {
          moduleId,
          status,
          startDate: status !== 'not-started' ? now : null,
          completionDate: status === 'completed' ? (data.completionDate || now) : null,
          attempts: status === 'failed' ? 1 : 0,
          createdAt: now,
          updatedAt: now,
          ...data
        };
        
        const id = await this.db.progress.add(progressData);
        console.log(`✅ Progresso creato: ${module.title} → ${status}`);
        
        return id;
      }
    } catch (error) {
      console.error('❌ Errore aggiornamento progresso:', error);
      throw error;
    }
  }
  
  /**
   * Recupera il progresso di un modulo
   * @param {number} moduleId - ID del modulo
   * @returns {Promise<Object|null>}
   */
  async getProgress(moduleId) {
    try {
      return await this.db.progress
        .where('moduleId').equals(moduleId)
        .first();
    } catch (error) {
      console.error('❌ Errore recupero progresso:', error);
      throw error;
    }
  }
  
  /**
   * Recupera tutti i progressi
   * @returns {Promise<Array>}
   */
  async getAllProgress() {
    try {
      return await this.db.progress.toArray();
    } catch (error) {
      console.error('❌ Errore recupero progressi:', error);
      throw error;
    }
  }
  
  /**
   * Recupera progressi con informazioni modulo
   * @returns {Promise<Array>}
   */
  async getProgressWithModules() {
    try {
      const progressRecords = await this.db.progress.toArray();
      
      const enriched = await Promise.all(
        progressRecords.map(async p => {
          const module = await this.db.modules.get(p.moduleId);
          return {
            ...p,
            module
          };
        })
      );
      
      return enriched;
    } catch (error) {
      console.error('❌ Errore recupero progressi con moduli:', error);
      throw error;
    }
  }
  
  /**
   * Recupera moduli per stato
   * @param {string} status - Stato da filtrare
   * @returns {Promise<Array>}
   */
  async getModulesByStatus(status) {
    try {
      const progressRecords = await this.db.progress
        .where('status').equals(status)
        .toArray();
      
      const modules = await Promise.all(
        progressRecords.map(p => this.db.modules.get(p.moduleId))
      );
      
      return modules.filter(m => m !== undefined);
    } catch (error) {
      console.error('❌ Errore recupero moduli per stato:', error);
      throw error;
    }
  }
  
  /**
   * Calcola statistiche di progresso
   * @returns {Promise<Object>}
   */
  async getStats() {
    try {
      const modules = await this.db.modules.toArray();
      const progressRecords = await this.db.progress.toArray();
      
      const progressMap = new Map(
        progressRecords.map(p => [p.moduleId, p])
      );
      
      const stats = {
        total: modules.length,
        completed: 0,
        inProgress: 0,
        failed: 0,
        notStarted: 0,
        completionRate: 0,
        averageScore: 0,
        recentCompletions: [],
        byCategory: {}
      };
      
      let totalScore = 0;
      let scoreCount = 0;
      
      modules.forEach(m => {
        const progress = progressMap.get(m.id);
        const status = progress?.status || 'not-started';
        
        // Conta per stato
        switch (status) {
          case 'completed':
            stats.completed++;
            break;
          case 'in-progress':
            stats.inProgress++;
            break;
          case 'failed':
            stats.failed++;
            break;
          default:
            stats.notStarted++;
        }
        
        // Calcola score medio
        if (progress?.assessmentScore) {
          totalScore += progress.assessmentScore;
          scoreCount++;
        }
        
        // Statistiche per categoria
        if (!stats.byCategory[m.category]) {
          stats.byCategory[m.category] = {
            total: 0,
            completed: 0,
            inProgress: 0
          };
        }
        
        stats.byCategory[m.category].total++;
        if (status === 'completed') {
          stats.byCategory[m.category].completed++;
        } else if (status === 'in-progress') {
          stats.byCategory[m.category].inProgress++;
        }
      });
      
      // Calcola percentuali
      stats.completionRate = stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;
      
      stats.averageScore = scoreCount > 0
        ? Math.round(totalScore / scoreCount)
        : 0;
      
      // Completamenti recenti (ultimi 5)
      const completed = progressRecords
        .filter(p => p.status === 'completed' && p.completionDate)
        .sort((a, b) => 
          new Date(b.completionDate) - new Date(a.completionDate)
        )
        .slice(0, 5);
      
      stats.recentCompletions = await Promise.all(
        completed.map(async p => {
          const module = await this.db.modules.get(p.moduleId);
          return {
            module,
            completionDate: p.completionDate,
            score: p.assessmentScore
          };
        })
      );
      
      return stats;
    } catch (error) {
      console.error('❌ Errore calcolo statistiche:', error);
      throw error;
    }
  }
  
  /**
   * Resetta il progresso di un modulo
   * @param {number} moduleId - ID del modulo
   * @returns {Promise<void>}
   */
  async resetProgress(moduleId) {
    try {
      await this.db.progress
        .where('moduleId').equals(moduleId)
        .delete();
      
      console.log(`✅ Progresso resettato per modulo ${moduleId}`);
    } catch (error) {
      console.error('❌ Errore reset progresso:', error);
      throw error;
    }
  }
  
  /**
   * Aggiunge una nota al progresso
   * @param {number} moduleId - ID del modulo
   * @param {string} note - Nota da aggiungere
   * @returns {Promise<void>}
   */
  async addNote(moduleId, note) {
    try {
      const progress = await this.getProgress(moduleId);
      
      if (!progress) {
        throw new Error('Progresso non trovato');
      }
      
      const existingNotes = progress.notes || '';
      const timestamp = new Date().toLocaleString('it-IT');
      const newNote = `[${timestamp}] ${note}`;
      
      await this.db.progress.update(progress.id, {
        notes: existingNotes ? `${existingNotes}\n${newNote}` : newNote,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ Nota aggiunta al progresso modulo ${moduleId}`);
    } catch (error) {
      console.error('❌ Errore aggiunta nota:', error);
      throw error;
    }
  }

  /**
   * Recupera progresso con informazioni modulo estese (contentPath, skillTags)
   * @returns {Promise<Array>}
   */
  async getProgressWithExtendedModules() {
    try {
      const progressRecords = await this.db.progress.toArray();
      
      const enriched = await Promise.all(
        progressRecords.map(async p => {
          const module = await this.db.modules.get(p.moduleId);
          return {
            ...p,
            module: module ? {
              ...module,
              contentPath: module.contentPath,
              skillTags: module.skillTags || [],
              revisionDate: module.revisionDate
            } : null
          };
        })
      );
      
      return enriched;
    } catch (error) {
      console.error('❌ Errore recupero progressi con moduli estesi:', error);
      throw error;
    }
  }

  /**
   * Recupera moduli completati con content path
   * @returns {Promise<Array>}
   */
  async getCompletedModulesWithContent() {
    try {
      const completedProgress = await this.db.progress
        .where('status').equals('completed')
        .toArray();
      
      const modules = await Promise.all(
        completedProgress.map(async p => {
          const module = await this.db.modules.get(p.moduleId);
          return module ? {
            ...module,
            completionDate: p.completionDate,
            assessmentScore: p.assessmentScore
          } : null;
        })
      );
      
      return modules.filter(m => m !== null && m.contentPath);
    } catch (error) {
      console.error('❌ Errore recupero moduli completati con content:', error);
      throw error;
    }
  }

  /**
   * Recupera moduli in corso con content path
   * @returns {Promise<Array>}
   */
  async getInProgressModulesWithContent() {
    try {
      const inProgress = await this.db.progress
        .where('status').equals('in-progress')
        .toArray();
      
      const modules = await Promise.all(
        inProgress.map(async p => {
          const module = await this.db.modules.get(p.moduleId);
          return module ? {
            ...module,
            startDate: p.startDate,
            notes: p.notes
          } : null;
        })
      );
      
      return modules.filter(m => m !== null && m.contentPath);
    } catch (error) {
      console.error('❌ Errore recupero moduli in corso con content:', error);
      throw error;
    }
  }

  /**
   * Recupera moduli disponibili per iniziare (prerequisiti soddisfatti)
   * @returns {Promise<Array>}
   */
  async getAvailableModules() {
    try {
      const modules = await this.db.modules.toArray();
      const progressRecords = await this.db.progress.toArray();
      
      const progressMap = new Map(
        progressRecords.map(p => [p.moduleId, p.status])
      );
      
      const available = [];
      
      for (const module of modules) {
        // Se già iniziato o completato, salta
        if (progressMap.get(module.id)) {
          continue;
        }
        
        // Verifica prerequisiti
        const canStart = await DependencyManager.canStartModule(module.id);
        
        if (canStart.canStart) {
          available.push({
            ...module,
            contentPath: module.contentPath,
            skillTags: module.skillTags || []
          });
        }
      }
      
      return available;
    } catch (error) {
      console.error('❌ Errore recupero moduli disponibili:', error);
      throw error;
    }
  }

  /**
   * Recupera statistiche avanzate con informazioni schema esteso
   * @returns {Promise<Object>}
   */
  async getExtendedStats() {
    try {
      const basicStats = await this.getStats();
      const modules = await this.db.modules.toArray();
      
      // Statistiche per skill tags
      const skillTagStats = {};
      modules.forEach(m => {
        const tags = m.skillTags || [];
        tags.forEach(tag => {
          if (!skillTagStats[tag]) {
            skillTagStats[tag] = { total: 0, completed: 0 };
          }
          skillTagStats[tag].total++;
          
          // Verifica se completato
          const progress = basicStats.byCategory[m.category];
          if (progress && progress.completed > 0) {
            // Approssimazione: se categoria ha completati, considera tag completato
            skillTagStats[tag].completed++;
          }
        });
      });
      
      // Statistiche per content path
      const modulesWithContent = modules.filter(m => m.contentPath).length;
      const contentCoverage = modules.length > 0
        ? Math.round((modulesWithContent / modules.length) * 100)
        : 0;
      
      return {
        ...basicStats,
        skillTagStats,
        contentCoverage: `${contentCoverage}%`,
        modulesWithContentPath: modulesWithContent,
        totalModules: modules.length,
        modulesNeedingRevision: await ModuleManager.getModulesNeedingRevision(365)
      };
    } catch (error) {
      console.error('❌ Errore calcolo statistiche estese:', error);
      throw error;
    }
  }

  /**
   * Naviga al contenuto del modulo (per integrazione Typemill)
   * @param {number} moduleId - ID del modulo
   * @returns {Promise<string>} URL del contenuto
   */
  async navigateToModuleContent(moduleId) {
    try {
      const module = await this.db.modules.get(moduleId);
      if (!module) {
        throw new Error('Modulo non trovato');
      }
      
      if (!module.contentPath) {
        throw new Error('Modulo senza contentPath definito');
      }
      
      // Per Typemill, il contentPath è relativo alla base URL
      const baseUrl = 'https://tuo-typemill-instance.com'; // Da configurare
      const contentUrl = `${baseUrl}${module.contentPath}`;
      
      console.log(`🌐 Navigazione a: ${contentUrl}`);
      
      // In un'app reale, qui si aprirebbe la pagina
      // window.open(contentUrl, '_blank');
      
      return contentUrl;
    } catch (error) {
      console.error('❌ Errore navigazione contenuto:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ProgressManager();

