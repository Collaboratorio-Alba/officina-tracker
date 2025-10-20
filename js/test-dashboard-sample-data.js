/**
 * Test Dashboard Sample Data
 * Popola il database con dati di esempio per testare il dashboard
 */

import ModuleManager from './database/module-manager.js';
import ProgressManager from './database/progress-manager.js';
import LevelDataLoader from './data/level-data-loader.js';

/**
 * Aggiunge dati di esempio per testare il dashboard
 */
export async function addSampleProgressData() {
  console.log('📊 Aggiunta dati di esempio per dashboard...');
  
  try {
    // Carica struttura modulare se non già caricata
    await LevelDataLoader.loadAllLevels();
    const modules = LevelDataLoader.getAllModules();
    
    // Importa moduli se database vuoto
    const existingModules = await ModuleManager.getAllModules();
    if (existingModules.length === 0) {
      console.log('📦 Importando moduli dalla struttura modulare...');
      await ModuleManager.bulkImportModules(modules);
      console.log(`✅ Importati ${modules.length} moduli`);
    }
    
    // Aggiungi progressi di esempio
    const progressManager = new ProgressManager();
    await progressManager.init();
    
    // Seleziona alcuni moduli per marcare come completati
    const sampleModules = modules.slice(0, 15); // Primi 15 moduli
    
    // Data di completamento distribuita negli ultimi 30 giorni
    const today = new Date();
    const progressData = [];
    
    for (let i = 0; i < sampleModules.length; i++) {
      const module = sampleModules[i];
      const daysAgo = Math.floor(Math.random() * 30); // 0-29 giorni fa
      const completionDate = new Date(today);
      completionDate.setDate(today.getDate() - daysAgo);
      
      progressData.push({
        moduleId: module.id,
        status: 'completed',
        completionDate: completionDate.toISOString(),
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        notes: 'Completato durante test dashboard',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Aggiungi progressi al database
    for (const progress of progressData) {
      await progressManager.updateProgress(progress.moduleId, {
        status: progress.status,
        completionDate: progress.completionDate,
        score: progress.score,
        notes: progress.notes
      });
    }
    
    console.log(`✅ Aggiunti ${progressData.length} progressi di esempio`);
    console.log('📅 Timeline dovrebbe ora mostrare dati di progresso');
    
    return {
      modules: modules.length,
      progressAdded: progressData.length,
      sampleModules: sampleModules.map(m => m.id)
    };
    
  } catch (error) {
    console.error('❌ Errore aggiunta dati di esempio:', error);
    throw error;
  }
}

/**
 * Verifica se il database ha dati sufficienti per il dashboard
 */
export async function checkDashboardData() {
  try {
    const modules = await ModuleManager.getAllModules();
    const progressManager = new ProgressManager();
    await progressManager.init();
    
    const completedProgress = await progressManager.db.progress
      .where('status').equals('completed')
      .and(p => p.completionDate !== null)
      .toArray();
    
    console.log('📊 Verifica dati dashboard:');
    console.log(`   - Moduli nel database: ${modules.length}`);
    console.log(`   - Progressi completati: ${completedProgress.length}`);
    console.log(`   - Progressi con date: ${completedProgress.filter(p => p.completionDate).length}`);
    
    if (completedProgress.length === 0) {
      console.log('⚠️ Nessun progresso completato trovato');
      console.log('💡 Esegui addSampleProgressData() per popolare il database');
    }
    
    return {
      modules: modules.length,
      completedProgress: completedProgress.length,
      hasTimelineData: completedProgress.filter(p => p.completionDate).length > 0
    };
  } catch (error) {
    console.error('❌ Errore verifica dati dashboard:', error);
    throw error;
  }
}

// Se eseguito direttamente, aggiungi dati di esempio
if (typeof window !== 'undefined' && window.location) {
  // Esponi funzioni globalmente per test da console
  window.addSampleProgressData = addSampleProgressData;
  window.checkDashboardData = checkDashboardData;
  
  console.log('📊 Dashboard Sample Data Loaded');
  console.log('💡 Usa addSampleProgressData() per popolare il database');
  console.log('💡 Usa checkDashboardData() per verificare i dati');
}