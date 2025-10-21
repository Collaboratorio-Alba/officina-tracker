/**
 * Backup Manager
 * Gestione backup e ripristino progressi apprendimento
 * Formato file JSON compatibile con WhatsApp
 */

import db from '../database/db-config.js';
import ProgressManager from '../database/progress-manager.js';
import AssessmentManager from '../database/assessment-manager.js';

class BackupManager {
  constructor() {
    this.db = db;
  }

  /**
   * Crea un backup di tutti i progressi e valutazioni
   * @returns {Promise<Object>} Dati di backup
   */
  async createBackup() {
    try {
      console.log('📦 Creazione backup progressi...');
      
      const [modules, progress, assessments] = await Promise.all([
        this.db.modules.toArray(),
        this.db.progress.toArray(),
        this.db.assessments.toArray()
      ]);

      // Crea mappa moduli per codice
      const moduleMap = new Map(modules.map(m => [m.id, m]));

      // Arricchisce progressi con informazioni modulo
      const enrichedProgress = progress.map(p => {
        const module = moduleMap.get(p.moduleId);
        return {
          moduleCode: module?.code,
          moduleTitle: module?.title,
          status: p.status,
          startDate: p.startDate,
          completionDate: p.completionDate,
          attempts: p.attempts,
          assessmentScore: p.assessmentScore,
          notes: p.notes,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        };
      });

      // Arricchisce valutazioni con informazioni modulo
      const enrichedAssessments = assessments.map(a => {
        const module = moduleMap.get(a.moduleId);
        return {
          moduleCode: module?.code,
          moduleTitle: module?.title,
          practicalApplied: a.practicalApplied,
          resultQuality: a.resultQuality,
          satisfactionLevel: a.satisfactionLevel,
          evaluatorName: a.evaluatorName,
          date: a.date,
          notes: a.notes,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt
        };
      });

      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        app: 'Ciclofficina Tracker',
        stats: {
          totalModules: modules.length,
          totalProgress: progress.length,
          totalAssessments: assessments.length,
          completed: progress.filter(p => p.status === 'completed').length,
          inProgress: progress.filter(p => p.status === 'in-progress').length
        },
        progress: enrichedProgress,
        assessments: enrichedAssessments
      };

      console.log('✅ Backup creato con successo');
      return backupData;
    } catch (error) {
      console.error('❌ Errore creazione backup:', error);
      throw error;
    }
  }

  /**
   * Esporta backup come file JSON scaricabile
   * @returns {Promise<void>}
   */
  async exportBackup() {
    try {
      const backupData = await this.createBackup();
      
      // Crea blob e URL per download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Nome file con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      a.download = `ciclofficina-backup-${timestamp}.json`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup URL
      URL.revokeObjectURL(url);
      
      console.log('✅ Backup esportato con successo');
    } catch (error) {
      console.error('❌ Errore esportazione backup:', error);
      throw error;
    }
  }

  /**
   * Importa dati da file backup
   * @param {File} file - File JSON di backup
   * @returns {Promise<Object>} Risultato import
   */
  async importBackup(file) {
    try {
      console.log('📥 Importazione backup...');
      
      // Leggi file
      const fileContent = await this.readFileAsText(file);
      const backupData = JSON.parse(fileContent);
      
      // Valida struttura backup
      this.validateBackup(backupData);
      
      // Crea mappa moduli per codice
      const modules = await this.db.modules.toArray();
      const moduleMap = new Map(modules.map(m => [m.code, m]));
      
      let importedProgress = 0;
      let importedAssessments = 0;
      let errors = [];
      
      // Importa progressi
      if (backupData.progress && Array.isArray(backupData.progress)) {
        for (const progressItem of backupData.progress) {
          try {
            const module = moduleMap.get(progressItem.moduleCode);
            if (!module) {
              errors.push(`Modulo non trovato: ${progressItem.moduleCode}`);
              continue;
            }
            
            // Aggiorna o crea progresso
            await ProgressManager.updateProgress(
              module.id,
              progressItem.status,
              {
                startDate: progressItem.startDate,
                completionDate: progressItem.completionDate,
                attempts: progressItem.attempts,
                assessmentScore: progressItem.assessmentScore,
                notes: progressItem.notes
              }
            );
            
            importedProgress++;
          } catch (error) {
            errors.push(`Errore import progresso ${progressItem.moduleCode}: ${error.message}`);
          }
        }
      }
      
      // Importa valutazioni
      if (backupData.assessments && Array.isArray(backupData.assessments)) {
        for (const assessmentItem of backupData.assessments) {
          try {
            const module = moduleMap.get(assessmentItem.moduleCode);
            if (!module) {
              errors.push(`Modulo non trovato per valutazione: ${assessmentItem.moduleCode}`);
              continue;
            }
            
            // Cerca progresso esistente per ottenere progressId
            const progress = await this.db.progress
              .where('moduleId').equals(module.id)
              .first();
              
            if (!progress) {
              errors.push(`Progresso non trovato per valutazione: ${assessmentItem.moduleCode}`);
              continue;
            }
            
            // Aggiorna o crea valutazione
            await AssessmentManager.upsertAssessment(
              module.id,
              progress.id,
              {
                practicalApplied: assessmentItem.practicalApplied,
                resultQuality: assessmentItem.resultQuality,
                satisfactionLevel: assessmentItem.satisfactionLevel,
                evaluatorName: assessmentItem.evaluatorName,
                date: assessmentItem.date,
                notes: assessmentItem.notes
              }
            );
            
            importedAssessments++;
          } catch (error) {
            errors.push(`Errore import valutazione ${assessmentItem.moduleCode}: ${error.message}`);
          }
        }
      }
      
      const result = {
        success: true,
        importedProgress,
        importedAssessments,
        totalErrors: errors.length,
        errors: errors
      };
      
      console.log('✅ Backup importato con successo:', result);
      return result;
    } catch (error) {
      console.error('❌ Errore importazione backup:', error);
      throw error;
    }
  }

  /**
   * Legge file come testo
   * @param {File} file - File da leggere
   * @returns {Promise<string>}
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(new Error('Errore lettura file'));
      reader.readAsText(file);
    });
  }

  /**
   * Valida struttura file backup
   * @param {Object} backupData - Dati backup
   */
  validateBackup(backupData) {
    if (!backupData.version) {
      throw new Error('File backup non valido: versione mancante');
    }
    
    if (!backupData.app || backupData.app !== 'Ciclofficina Tracker') {
      throw new Error('File backup non valido: applicazione non riconosciuta');
    }
    
    if (!backupData.progress || !Array.isArray(backupData.progress)) {
      throw new Error('File backup non valido: dati progresso mancanti');
    }
  }

  /**
   * Genera backup come stringa JSON per condivisione
   * @returns {Promise<string>} JSON stringificato
   */
  async generateBackupString() {
    const backupData = await this.createBackup();
    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Importa da stringa JSON
   * @param {string} backupString - Stringa JSON di backup
   * @returns {Promise<Object>} Risultato import
   */
  async importFromString(backupString) {
    try {
      // Crea file virtuale
      const blob = new Blob([backupString], { type: 'application/json' });
      const file = new File([blob], 'backup.json', { type: 'application/json' });
      
      return await this.importBackup(file);
    } catch (error) {
      console.error('❌ Errore import da stringa:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new BackupManager();