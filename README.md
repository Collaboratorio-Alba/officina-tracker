# 🚲 Tracker Formazione Ciclofficina

Sistema di tracciamento dei moduli formativi per ciclofficina popolare,
completamente client-side, i progressi rimangono in un database locale.
Funziona sui device degli utenti senza bisogno di registrazione,
eventualmente si possono esportare i progressi e caricarli su un altro
dispositivo.

## Online su GitHub Pages

L'applicazione è pubblicata automaticamente su GitHub Pages:

- **URL Live:** <https://collaboratorio-alba.github.io/officina-tracker/>

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

### 🌳 Knowledge Tree Structure

- **Versioni digitale e stampabile** - Ispirata al progetto [MakerSkillTree](https://github.com/sjpiper145/MakerSkillTree)
- **10 livelli di dipendenze interconnesse** con 122 relazioni tra moduli
- **Visualizzazione SVG** - [`js/data/skilltree.svg`](js/data/skilltree.svg) - Rappresentazione grafica dell'intera struttura
- **Mappa concettuale** - [`js/data/schema/ciclofficina_2-150.jpg`](js/data/schema/ciclofficina_2-150.jpg) - Overview visivo delle aree didattiche

![Mappa Stampata e compilata](js/data/schema/printed_skilltrees.jpg)

- **Visualizzazione Grafica** - Cytoscape.js per grafi complessi e interattivi

La struttura modulare segue un approccio di "albero delle competenze" dove ogni nodo rappresenta una skill specifica e le dipendenze definiscono il percorso di apprendimento ottimale.

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
