/**
 * Assessment Manager
 * Gestione verifiche pratiche e qualità risultati
 */

import db from './db-config.js';

class AssessmentManager {
  constructor() {
    this.db = db;
  }

  // Crea o aggiorna una valutazione
  async upsertAssessment(moduleId, progressId, data) {
    try {
      const existing = await this.db.assessments
        .where({ moduleId, progressId })
        .first();

      if (existing) {
        await this.db.assessments.update(existing.id, {
          ...data,
          updatedAt: new Date().toISOString()
        });
        console.log(`🔄 Valutazione aggiornata per modulo ${moduleId}`);
      } else {
        await this.db.assessments.add({
          moduleId,
          progressId,
          date: new Date().toISOString(),
          ...data
        });
        console.log(`✅ Valutazione creata per modulo ${moduleId}`);
      }
    } catch (error) {
      console.error('❌ Errore creazione/aggiornamento valutazione:', error);
      throw error;
    }
  }

  // Recupera valutazioni
  async getAssessmentByModule(moduleId) {
    return await this.db.assessments.where('moduleId').equals(moduleId).first();
  }

  async getAllAssessments() {
    return await this.db.assessments.toArray();
  }

  // Elimina valutazione
  async deleteAssessment(id) {
    await this.db.assessments.delete(id);
    console.log(`🗑️ Valutazione rimossa: ID ${id}`);
  }

  // Riassunto valutativi integrati
  async getDetailedModuleStatus() {
    const modules = await this.db.modules.toArray();
    const progress = await this.db.progress.toArray();
    const assessments = await this.db.assessments.toArray();

    const progressMap = new Map(progress.map(p => [p.moduleId, p]));
    const assessMap = new Map(assessments.map(a => [a.moduleId, a]));

    return modules.map(m => {
      const p = progressMap.get(m.id);
      const a = assessMap.get(m.id);
      return {
        Modulo: m.title,
        Stato: p?.status ?? 'da iniziare',
        'Applicato in pratica': a?.practicalApplied ? '✅ sì' : '❌ no',
        'Qualità risultato': a?.resultQuality ?? '-',
        'Soddisfazione (%)': a?.satisfactionLevel ?? 0
      };
    });
  }
}

export default new AssessmentManager();

