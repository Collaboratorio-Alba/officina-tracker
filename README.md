# 🚲 Tracker Formazione Ciclofficina

Sistema di tracciamento dei moduli formativi per ciclofficina popolare, 
completamente client-side, i progressi rimangono in un database locale.
Funziona sui device degli utenti senza bisogno di registrazione, 
eventualmente si possono esportare i progressi e caricarli su un altro
dispositivo.

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

## 🌐 Deployment

### GitHub Pages
L'applicazione è pubblicata automaticamente su GitHub Pages:
- **URL Live:** https://collaboratorio-alba.github.io/officina-tracker/

### Build per Produzione
```bash
npm run build
```
Il build viene generato nella cartella `dist/` e può essere servito da qualsiasi web server statico.

## 📖 Utilizzo

### 🎯 Dashboard Views
- **📊 Heatmap View** - Panoramica visiva dei progressi
- **📅 Timeline View** - Cronologia completamenti
- **📈 Stats View** - Metriche dettagliate
- **🎯 Goal View** - Pianificazione obiettivi

### 📈 Tracciare i Progressi
Clicca su un modulo nel grafo per vedere i dettagli e aggiornare lo stato.

### 🎯 Pianificare Obiettivi
Usa la Goal View per selezionare un obiettivo e visualizzare il percorso di apprendimento ottimale.

## 🏗️ Schema

- **`contentPath`** 📁 - Separazione netta contenuti/progressi
- **`skillTags`** 🏷️ - Classificazione competenze per ricerca avanzata
- **`revisionDate`** 📅 - Versionamento e gestione aggiornamenti
- **Migrazione Automatica** 🔄 - Aggiornamento trasparente di nuovi moduli

### 📚 Documentazione Schema Esteso
Vedi [SCHEMA_EXTENDED_README.md](SCHEMA_EXTENDED_README.md) per dettagli completi.

## 🔗 Integrazione con altri CMS

Il sistema supporta navigazione diretta ai contenuti `contentPath`.


## 📊 Dati del Sistema di tracciamento dell'apprendimento per ciclofficina

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


## 📄 Licenza

MIT
