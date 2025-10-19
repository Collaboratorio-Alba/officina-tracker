# Tracker Formazione Ciclofficina

Sistema di tracciamento dei moduli formativi per ciclofficina popolare, completamente client-side.

## Caratteristiche

- ✅ Completamente client-side (nessun server necessario)
- 🔒 Nessuna trasmissione di dati personali
- 💾 Storage locale con IndexedDB
- 🌳 Visualizzazione albero delle dipendenze
- 🖨️ Funzionalità di stampa integrata
- 📱 Design responsive

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

## Tecnologie

- Vanilla JavaScript (ES6+)
- Dexie.js per IndexedDB
- Cytoscape.js per visualizzazione grafo (da integrare in Fase 3)
- CSS3

## Licenza

MIT
