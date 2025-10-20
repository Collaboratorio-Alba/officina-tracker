# 🚲 Tracker Formazione Ciclofficina

Sistema di tracciamento dei moduli formativi per ciclofficina popolare, completamente client-side.

**Versione Schema: 1.1.0** - Esteso per integrazione Typemill

## ✨ Caratteristiche Principali

### 🎯 Core Features
- ✅ **Completamente client-side** - Nessun server necessario
- 🔒 **Privacy First** - Nessuna trasmissione di dati personali
- 💾 **Storage locale** - IndexedDB per persistenza dati
- 📱 **Design responsive** - Ottimizzato per tutti i dispositivi

### 📊 Dashboard Avanzato
- 📈 **Heatmap Progressi** - Visualizzazione grafica dei progressi
- 📅 **Timeline Cronologica** - Storia dei completamenti nel tempo
- 📊 **Statistiche Dettagliate** - Metriche avanzate per area didattica
- 🎯 **Goal Tracking** - Pianificazione e tracciamento obiettivi

### 🌳 Visualizzazioni
- 🌳 **Albero Dipendenze** - Mappa interattiva delle relazioni tra moduli
- 🔗 **Analisi Connessioni** - 11 livelli di dipendenze interconnesse
- 🎨 **Visualizzazione Grafica** - Cytoscape.js per grafi complessi

### 🔧 Gestione Dati
- 🏷️ **Schema Esteso 1.1.0** - Skill tags e classificazione competenze
- 🔗 **Integrazione Typemill** - Separazione contenuti/progressi
- 📅 **Versionamento** - Revision date per aggiornamenti
- 🔄 **Migrazione Automatica** - Transizione senza perdita dati

### 🎯 Goal & Planning
- 🗺️ **Path Planning** - Calcolo percorso ottimale per obiettivi
- 📋 **Step-by-Step** - Guida sequenziale ai moduli richiesti
- ⏱️ **Stima Tempi** - Pianificazione realistico dei tempi di completamento
- 🔍 **Analisi Prerequisiti** - Identificazione dipendenze critiche

## 🚀 Installazione

1. **Clona il repository**
2. **Installa le dipendenze:**
   ```bash
   npm install
   ```
3. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```
4. **Apri il browser all'indirizzo:** `http://localhost:8080`

## 📖 Utilizzo

### 🎯 Dashboard Views
- **📊 Heatmap View** - Panoramica visiva dei progressi
- **📅 Timeline View** - Cronologia completamenti
- **📈 Stats View** - Metriche dettagliate
- **🎯 Goal View** - Pianificazione obiettivi

### ➕ Aggiungere un Modulo
Clicca sul pulsante "Aggiungi Modulo" nella sidebar e compila il form.

### 📈 Tracciare i Progressi
Clicca su un modulo nel grafo per vedere i dettagli e aggiornare lo stato.

### 🖨️ Stampare il Riepilogo
Usa il pulsante "Stampa Riepilogo" per generare un report stampabile.

### 🎯 Pianificare Obiettivi
Usa la Goal View per selezionare un obiettivo e visualizzare il percorso di apprendimento ottimale.

## 🏗️ Schema Esteso 1.1.0

Il sistema supporta ora lo schema esteso 1.1.0 con:

- **`contentPath`** 📁 - Separazione netta contenuti/progressi per Typemill
- **`skillTags`** 🏷️ - Classificazione competenze per ricerca avanzata
- **`revisionDate`** 📅 - Versionamento e gestione aggiornamenti
- **Migrazione Automatica** 🔄 - Transizione trasparente da schema 1.0.0

### 📚 Documentazione Schema Esteso
Vedi [SCHEMA_EXTENDED_README.md](SCHEMA_EXTENDED_README.md) per dettagli completi.

## 🔗 Integrazione Typemill

Il sistema supporta navigazione diretta ai contenuti Typemill tramite `contentPath`.

## 🧪 Test e Verifica

### Test Schema Esteso
```javascript
// Test completo schema esteso
await window.CiclofficinaTracker.testExtendedSchema();

// Test funzionalità specifiche
await window.CiclofficinaTracker.ModuleManager.getAllSkillTags();
await window.CiclofficinaTracker.ProgressManager.getExtendedStats();
```

### Test Dashboard
```javascript
// Test dashboard completo
await window.CiclofficinaTracker.testDashboard();

// Test goal path
await window.CiclofficinaTracker.DashboardManager.getGoalPath('BIKE-11.1.1');
```

## 📊 Dati del Sistema

- **11 Livelli** di formazione
- **Moduli interconnessi** con dipendenze complesse
- **Categorie multiple** per organizzazione avanzata
- **Timeline progressi** con dati storici

## 🛠️ Tecnologie

- **Vanilla JavaScript (ES6+)** ⚡
- **Dexie.js** 💾 - IndexedDB wrapper
- **Cytoscape.js** 🌳 - Visualizzazione grafo
- **CSS3** 🎨 - Styling responsive
- **Modular Architecture** 🏗️ - Design scalabile

## 📁 Struttura Progetto

```
js/
├── app.js                 # Applicazione principale
├── database/              # Gestione dati
│   ├── dashboard-manager.js
│   ├── progress-manager.js
│   └── module-manager.js
├── views/                 # Interfacce utente
│   └── dashboard-view.js
├── data/                  # Dati formativi
│   ├── ciclofficina_level*.json
│   └── level-data-loader.js
└── utils/                 # Utility
    └── backup-manager.js
```

## 🎉 Funzionalità Avanzate

### 🔍 Analisi Dipendenze
- Mappatura completa di 11 livelli
- Identificazione moduli isolati
- Ottimizzazione percorsi di apprendimento

### 📈 Metriche Dashboard
- Progresso per area didattica
- Tendenze temporali
- Heatmap visivo dei completamenti
- Statistiche avanzate

### 🎯 Goal System
- Selezione obiettivi specifici
- Calcolo percorso ottimale
- Stima tempi di completamento
- Gestione prerequisiti

## 📄 Licenza

MIT
