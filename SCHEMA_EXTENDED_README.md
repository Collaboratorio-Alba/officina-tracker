# Schema Esteso 1.1.0 - Documentazione

## Panoramica

Il sistema è stato aggiornato alla versione 1.1.0 per supportare l'integrazione con **Typemill** e introdurre una separazione netta tra **gestione contenuti** e **tracciamento progressi**.

## Principali Modifiche

### 1. Separazione Contenuti/Progressi

**Schema Vecchio (1.0.0):**
- I moduli contenevano sia i dati didattici che i link ai contenuti
- Nessuna separazione chiara tra gestione contenuti e progressi

**Schema Nuovo (1.1.0):**
- **`contentPath`**: Campo unico che punta al contenuto didattico in Typemill
- Separazione netta: il tracker gestisce solo i progressi, Typemill gestisce i contenuti

### 2. Nuovi Metadati

**Campi Aggiunti:**
- **`skillTags`**: Array di tag per classificazione competenze
- **`revisionDate`**: Data ultima revisione per versionamento
- **`contentPath`**: Path relativo al contenuto Typemill

### 3. Struttura File Aggiornata

**File Nuovi:**
- `courses-structure-extended.json` - Struttura corsi (solo codici moduli)
- `modules-extended.json` - Dettagli moduli con nuovi campi
- `migration-manager.js` - Gestione migrazione automatica

## Struttura Dettagliata

### courses-structure-extended.json
```json
{
  "version": "1.1.0",
  "courses": [
    {
      "id": "ciclofficina-basics",
      "teachingAreas": [
        {
          "name": "Sicurezza e manutenzione di base",
          "modules": ["BIKE-001"]
        }
      ]
    }
  ]
}
```

### modules-extended.json
```json
{
  "version": "1.1.0",
  "modules": [
    {
      "code": "BIKE-001",
      "title": "Introduzione alla manutenzione",
      "contentPath": "/ciclofficina-basics/sicurezza/introduzione-manutenzione",
      "skillTags": ["sicurezza", "teoria", "componenti"],
      "revisionDate": "2025-10-19",
      "prerequisites": []
    }
  ]
}
```

## Integrazione Typemill

### Content Path Structure
I `contentPath` seguono questa struttura:
```
/{course-slug}/{area-slug}/{module-slug}
```

**Esempio:**
```
/ciclofficina-basics/sicurezza/introduzione-manutenzione
```

### Navigazione Contenuti
```javascript
// Naviga al contenuto di un modulo
const contentUrl = await ProgressManager.navigateToModuleContent(moduleId);
```

## API Estesa

### ModuleManager - Nuovi Metodi

```javascript
// Gestione Skill Tags
const allTags = await ModuleManager.getAllSkillTags();
const modulesByTag = await ModuleManager.getModulesBySkillTag('sicurezza');
await ModuleManager.addSkillTag(moduleId, 'nuovo-tag');
await ModuleManager.removeSkillTag(moduleId, 'tag-da-rimuovere');

// Gestione Revisioni
const needsRevision = await ModuleManager.getModulesNeedingRevision(30);
await ModuleManager.updateRevisionDate(moduleId, '2025-10-20');

// Ricerca per Content Path
const module = await ModuleManager.getModuleByContentPath('/path/typemill');
```

### ProgressManager - Metodi Estesi

```javascript
// Progressi con informazioni estese
const extendedProgress = await ProgressManager.getProgressWithExtendedModules();

// Moduli con content path
const completedWithContent = await ProgressManager.getCompletedModulesWithContent();
const inProgressWithContent = await ProgressManager.getInProgressModulesWithContent();

// Statistiche avanzate
const extendedStats = await ProgressManager.getExtendedStats();

// Moduli disponibili (prerequisiti soddisfatti)
const available = await ProgressManager.getAvailableModules();
```

## Migrazione Automatica

### Come Funziona
1. Il sistema rileva automaticamente se serve migrazione
2. Backup dati esistenti
3. Importa nuovi dati schema esteso
4. Verifica integrità migrazione

### Test Migrazione
```javascript
// Verifica se serve migrazione
const needsMigration = await MigrationManager.needsMigration();

// Esegui migrazione manuale
const result = await MigrationManager.migrateToExtendedSchema();
```

## Test del Sistema

### Test Schema Esteso
```javascript
// Esegui test completo
await testExtendedSchema();

// O usa la funzione globale
await window.CiclofficinaTracker.testExtendedSchema();
```

### Console Commands
```javascript
// Test funzionalità specifiche
CiclofficinaTracker.ModuleManager.getAllSkillTags();
CiclofficinaTracker.ProgressManager.getExtendedStats();
CiclofficinaTracker.MigrationManager.needsMigration();
```

## Configurazione Typemill

### Base URL
Il sistema assume una base URL per Typemill. Per configurare:

```javascript
// In ProgressManager.navigateToModuleContent()
const baseUrl = 'https://tuo-typemill-instance.com'; // DA CONFIGURARE
```

### Struttura Contenuti Typemill
I contenuti in Typemill dovrebbero seguire la stessa struttura dei `contentPath`:

```
/content/
  └── ciclofficina-basics/
      ├── sicurezza/
      │   └── introduzione-manutenzione.md
      ├── meccanica/
      │   ├── uso-attrezzi-base.md
      │   └── rimozione-installazione-ruote.md
      └── trasmissione/
          └── rimozione-installazione-catena.md
```

## Best Practices

### 1. Gestione Skill Tags
- Usa tag consistenti e descrittivi
- Limita a 3-5 tag per modulo
- Usa tag riutilizzabili tra moduli simili

### 2. Revisioni Periodiche
- Aggiorna `revisionDate` dopo modifiche significative
- Usa `getModulesNeedingRevision()` per identificare contenuti obsoleti

### 3. Content Path
- Mantieni struttura coerente con Typemill
- Usa slug generati automaticamente quando possibile
- Testa sempre i link di navigazione

## Risoluzione Problemi

### Errori Comuni

**"Modulo senza contentPath"**
- Verifica che tutti i moduli in `modules-extended.json` abbiano `contentPath`
- Usa `ModuleManager.generateContentPath()` per generare automaticamente

**"Migrazione fallita"**
- Controlla la console per errori specifici
- Verifica che i file JSON siano validi
- Usa `MigrationManager.backupExistingData()` per backup

**"Skill Tags non trovati"**
- Verifica che i moduli abbiano l'array `skillTags`
- Usa `ModuleManager.addSkillTag()` per aggiungere tag mancanti

## Versioni

- **1.0.0**: Schema originale
- **1.1.0**: Schema esteso per Typemill
  - Aggiunti `skillTags`, `revisionDate`, `contentPath`
  - Separazione contenuti/progressi
  - Migrazione automatica