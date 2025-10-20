# Tracker Formazione Ciclofficina

Sistema di tracciamento dei moduli formativi per ciclofficina popolare, completamente client-side.

**Versione Schema: 1.1.0** - Esteso per integrazione Typemill

## Caratteristiche

- ✅ Completamente client-side (nessun server necessario)
- 🔒 Nessuna trasmissione di dati personali
- 💾 Storage locale con IndexedDB
- 🌳 Visualizzazione albero delle dipendenze
- 🖨️ Funzionalità di stampa integrata
- 📱 Design responsive
- 🏷️ **Schema Esteso 1.1.0**: Skill tags e classificazione competenze
- 🔗 **Integrazione Typemill**: Separazione contenuti/progressi
- 📅 **Versionamento**: Revision date per aggiornamenti
- 🔄 **Migrazione Automatica**: Transizione senza perdita dati

## Installazione

1. Clona il repository
2. Installa le dipendenze:

npm install

3. Avvia il server di sviluppo:

npm run dev

4. Apri il browser all'indirizzo: `http://localhost:8080`

## Utilizzo

### Aggiungere un Modulo
Clicca sul pulsante "Aggiungi Modulo" nella sidebar e compila il form.

### Tracciare i Progressi
Clicca su un modulo nel grafo per vedere i dettagli e aggiornare lo stato.

### Stampare il Riepilogo
Usa il pulsante "Stampa Riepilogo" per generare un report stampabile.

## Schema Esteso 1.1.0

Il sistema supporta ora lo schema esteso 1.1.0 con:

- **`contentPath`**: Separazione netta contenuti/progressi per Typemill
- **`skillTags`**: Classificazione competenze per ricerca avanzata
- **`revisionDate`**: Versionamento e gestione aggiornamenti
- **Migrazione Automatica**: Transizione trasparente da schema 1.0.0

### Documentazione Schema Esteso
Vedi [SCHEMA_EXTENDED_README.md](SCHEMA_EXTENDED_README.md) per dettagli completi.

## Utilizzo

### Aggiungere un Modulo
Clicca sul pulsante "Aggiungi Modulo" nella sidebar e compila il form.

### Tracciare i Progressi
Clicca su un modulo nel grafo per vedere i dettagli e aggiornare lo stato.

### Stampare il Riepilogo
Usa il pulsante "Stampa Riepilogo" per generare un report stampabile.

### Integrazione Typemill
Il sistema supporta navigazione diretta ai contenuti Typemill tramite `contentPath`.

## Test Schema Esteso

```javascript
// Test completo schema esteso
await window.CiclofficinaTracker.testExtendedSchema();

// Test funzionalità specifiche
await window.CiclofficinaTracker.ModuleManager.getAllSkillTags();
await window.CiclofficinaTracker.ProgressManager.getExtendedStats();
```

## Tecnologie

- Vanilla JavaScript (ES6+)
- Dexie.js per IndexedDB
- Cytoscape.js per visualizzazione grafo (da integrare in Fase 3)
- CSS3

## Licenza

MIT
