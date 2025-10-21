# Struttura Modulare a Livelli - Documentazione

## Panoramica

La nuova struttura modulare a livelli sostituisce i file JSON monolitici (`courses-structure-extended.json` e `modules-extended.json`) con una serie di file organizzati per livelli (`ciclofficina_level1.json` - `ciclofficina_level7.json`).

## File Struttura

### File Originali (Deprecati)
- `js/data/courses-structure-extended.json` - Struttura corsi monolitica
- `js/data/modules-extended.json` - Moduli monolitici

### File Nuovi (Modulari)
- `js/data/ciclofficina_level1.json` - Livello 1: Fondamenti Teorici Base
- `js/data/ciclofficina_level2.json` - Livello 2: Diagnostica e Verifica
- `js/data/ciclofficina_level3.json` - Livello 3: Pneumatici e Camere d'Aria
- `js/data/ciclofficina_level4.json` - Livello 4: Sistema Frenante
- `js/data/ciclofficina_level5.json` - Livello 5: Trasmissione Base
- `js/data/ciclofficina_level6.json` - Livello 6: Ruote e Mozzi
- `js/data/ciclofficina_level7.json` - Livello 7: Cambio Meccanico

## Componenti Tecnici

### 1. LevelDataLoader (`js/data/level-data-loader.js`)
Carica automaticamente tutti i file di livello e converte la struttura in formato compatibile con lo schema esteso.

**Funzioni principali:**
- `loadAllLevels()` - Carica tutti i file di livello
- `getAllModules()` - Restituisce tutti i moduli convertiti
- `getStats()` - Statistiche sulla struttura modulare
- `isLoaded()` - Verifica se i dati sono stati caricati

### 2. LevelMigrationManager (`js/database/level-migration-manager.js`)
Gestisce la migrazione dai dati esistenti alla nuova struttura modulare.

**Funzioni principali:**
- `needsLevelMigration()` - Verifica se serve migrazione
- `migrateToLevelStructure()` - Esegue la migrazione
- `checkCompatibility()` - Verifica compatibilità
- `preserveProgress()` - Preserva progressi esistenti

### 3. App Integration (`js/app.js`)
L'applicazione principale è stata aggiornata per utilizzare automaticamente la struttura modulare.

## Utilizzo

### Setup Iniziale
L'applicazione carica automaticamente la struttura modulare al primo avvio o quando il database è vuoto.

### Migrazione da Dati Esistenti
Se esistono dati precedenti, l'applicazione:
1. Verifica se serve migrazione
2. Esegue migrazione automatica preservando progressi
3. Carica la nuova struttura modulare

### Testing da Console
```javascript
// Verifica stato corrente
await CiclofficinaTracker.checkStatus()

// Test struttura modulare
await CiclofficinaTracker.testModularStructure()

// Verifica migrazione
await CiclofficinaTracker.checkMigration()

// Setup pulito (cancella tutto e ricarica struttura modulare)
await CiclofficinaTracker.cleanSetup()
```

## Schema di Conversione

### Da Struttura Livello a Schema Esteso
I file di livello utilizzano un formato semplificato che viene convertito automaticamente:

**Formato Livello:**
```json
{
  "teachingArea": {
    "name": "Livello 1 — Fondamenti Teorici Base",
    "description": "...",
    "color": "#e67e22"
  },
  "modules": [
    {
      "id": "BIKE-1.1.1",
      "title": "Riconoscimento telaio e materiali",
      "description": "...",
      "difficulty": "base",
      "estimatedDuration": 8,
      "contentPath": "/content/bike-1.1.1.md",
      "toolsRequired": ["magnete", "lima piccola"],
      "learningOutcomes": [...],
      "practicalCriteria": [...],
      "skillTags": ["diagnosi", "materiali", "recupero"],
      "revisionDate": null,
      "dependencies": [
        {
          "moduleId": "BIKE-1.1.1",
          "type": "mandatory"
        }
      ]
    }
  ]
}
```

**Formato Schema Esteso (Convertito):**
```json
{
  "code": "BIKE-1.1.1",
  "title": "Riconoscimento telaio e materiali",
  "slug": "riconoscimento-telaio-materiali",
  "description": "...",
  "category": "diagnosi",
  "type": "presenza",
  "difficulty": "base",
  "contentPath": "/ciclofficina-basics/fondamenti/riconoscimento-telaio-materiali",
  "skillTags": ["diagnosi", "materiali", "recupero"],
  "revisionDate": null,
  "prerequisites": [],
  "estimatedDuration": 8,
  "toolsRequired": ["magnete", "lima piccola"],
  "learningOutcomes": [...],
  "practicalCriteria": {
    "description": "...",
    "requiredSkills": [...],
    "assessmentMethod": "pratica-supervisionata",
    "qualityMetrics": [...]
  },
  "teachingArea": "Livello 1 — Fondamenti Teorici Base"
}
```

## Vantaggi della Nuova Struttura

### 1. Modularità
- Ogni livello è autonomo e può essere aggiornato indipendentemente
- Aggiunta di nuovi livelli senza modificare file esistenti

### 2. Manutenibilità
- File più piccoli e gestibili
- Struttura coerente tra livelli
- Facile debugging e testing

### 3. Scalabilità
- Aggiunta di nuovi livelli senza impatto su quelli esistenti
- Possibilità di versioning per livello

### 4. Compatibilità
- Migrazione automatica preservando dati esistenti
- Schema di conversione trasparente
- Backward compatibility

## Risoluzione Problemi

### Problema: "LevelMigrationManager is not defined"
**Soluzione:** Verificare che i file siano importati correttamente in `index.html`:
```html
<script type="module">
import LevelDataLoader from './js/data/level-data-loader.js';
import LevelMigrationManager from './js/database/level-migration-manager.js';
// ... altri import
</script>
```

### Problema: Dati vecchi ancora visibili
**Soluzione:** 
1. Verificare migrazione: `await CiclofficinaTracker.checkMigration()`
2. Eseguire setup pulito: `await CiclofficinaTracker.cleanSetup()`
3. Ricaricare la pagina

### Problema: Errori durante il caricamento
**Soluzione:**
1. Controllare console per errori di caricamento file
2. Verificare che tutti i file di livello esistano
3. Controllare sintassi JSON nei file di livello

## Statistiche Struttura Modulare

La nuova struttura include:
- **7 livelli** di formazione
- **Oltre 100 moduli** organizzati per competenza
- **Aree didattiche** specializzate per livello
- **Dipendenza tra moduli** per percorso di apprendimento strutturato

## Aggiornamenti Futuri

Per aggiungere nuovi livelli:
1. Creare file `ciclofficina_levelX.json` nella cartella `js/data/`
2. Seguire lo schema esistente
3. L'applicazione caricherà automaticamente il nuovo livello

Per modificare livelli esistenti:
1. Modificare il file del livello specifico
2. L'applicazione applicherà automaticamente le modifiche al prossimo caricamento