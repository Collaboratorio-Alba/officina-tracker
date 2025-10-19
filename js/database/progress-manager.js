/**
 * Progress Manager
 * Gestione del progresso utente nei moduli formativi
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
  async updateProgress(moduleId, status, additionalData = {}) {
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
          ...additionalData,
          updatedAt: now
        };
        
        // Se completato, aggiungi data completamento
        if (status === 'completed' && !existing.completionDate) {
          updates.completionDate = now;
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
          completionDate: status === 'completed' ? now : null,
          attempts: status === 'failed' ? 1 : 0,
          createdAt: now,
          updatedAt: now,
          ...additionalData
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
}

// Export singleton instance
export default new ProgressManager();

