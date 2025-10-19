/**
 * Configurazione Database Dexie.js
 * Setup dello schema per il tracker formazione ciclofficina
 */

import Dexie from '../../node_modules/dexie/dist/dexie.mjs';

// Creazione istanza database
const db = new Dexie('CiclofficinaTracker', { autoOpen: true });

// Definizione schema database
db.version(2).stores({
  // Tabella moduli formativi
  modules: '++id, code, title, category, type, difficulty, &slug, teachingArea',
  
  // Tabella dipendenze tra moduli
  dependencies: '++id, [moduleId+prerequisiteId], moduleId, prerequisiteId, dependencyType',
  
  // Tabella progressi utente
  progress: '++id, &moduleId, status, completionDate',
  
  // Tabella categorie
  categories: '++id, name, &slug, color',
  
  // Tabella valutazioni pratiche
  assessments: '++id, moduleId, progressId, evaluatorName, date, practicalApplied, resultQuality, satisfactionLevel'
});

// Event handlers per debug (opzionale)
db.on('ready', () => {
  console.log('✅ Database Dexie pronto');
});

db.on('populate', async () => {
  console.log('🔄 Popolamento iniziale database...');
  
  // Categorie predefinite
  await db.categories.bulkAdd([
    { name: 'Trasmissione', slug: 'trasmissione', color: '#3498db' },
    { name: 'Freni', slug: 'freni', color: '#e74c3c' },
    { name: 'Ruote', slug: 'ruote', color: '#2ecc71' },
    { name: 'Telaio', slug: 'telaio', color: '#f39c12' },
    { name: 'Sterzo', slug: 'sterzo', color: '#9b59b6' },
    { name: 'Componentistica', slug: 'componentistica', color: '#1abc9c' },
    { name: 'Sicurezza', slug: 'sicurezza', color: '#e67e22' }
  ]);
  
  console.log('✅ Categorie predefinite create');
});

// Gestione errori
db.on('blocked', () => {
  console.warn('⚠️ Database bloccato da altra tab/finestra');
});

// Export database instance
export default db;

