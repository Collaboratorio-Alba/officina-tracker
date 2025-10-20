/**
 * Test Struttura Modulare
 * Verifica del funzionamento della migrazione a struttura a livelli
 */

import LevelDataLoader from './data/level-data-loader.js';
import LevelMigrationManager from './database/level-migration-manager.js';
import ModuleManager from './database/module-manager.js';

class ModularStructureTester {
  constructor() {
    this.results = {};
  }

  /**
   * Esegue tutti i test
   */
  async runAllTests() {
    console.log('🧪 INIZIO TEST STRUTTURA MODULARE');
    console.log('==================================\n');

    try {
      // Test 1: Caricamento struttura modulare
      await this.testLevelDataLoading();
      
      // Test 2: Conversione schema esteso
      await this.testSchemaConversion();
      
      // Test 3: Verifica compatibilità
      await this.testCompatibility();
      
      // Test 4: Migrazione (opzionale)
      await this.testMigration();
      
      console.log('\n==================================');
      console.log('✅ TUTTI I TEST COMPLETATI');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test fallito:', error);
    }
  }

  /**
   * Test caricamento dati di livello
   */
  async testLevelDataLoading() {
    console.log('1. TEST CARICAMENTO DATI LIVELLO');
    console.log('--------------------------------');
    
    try {
      await LevelDataLoader.loadAllLevels();
      
      if (!LevelDataLoader.isLoaded()) {
        throw new Error('Caricamento fallito');
      }
      
      const stats = LevelDataLoader.getStats();
      this.results.levelLoading = {
        success: true,
        stats: stats
      };
      
      console.log(`✅ Livelli caricati: ${stats.levels}`);
      console.log(`✅ Moduli totali: ${stats.modules}`);
      console.log(`✅ Aree didattiche: ${stats.teachingAreas.join(', ')}`);
      
      // Dettaglio per livello
      console.log('\n   Dettaglio moduli per livello:');
      Object.entries(stats.modulesByLevel).forEach(([level, count]) => {
        console.log(`   - Livello ${level}: ${count} moduli`);
      });
      
    } catch (error) {
      this.results.levelLoading = {
        success: false,
        error: error.message
      };
      console.error(`❌ Fallito: ${error.message}`);
    }
  }

  /**
   * Test conversione a schema esteso
   */
  async testSchemaConversion() {
    console.log('\n2. TEST CONVERSIONE SCHEMA ESTESO');
    console.log('----------------------------------');
    
    try {
      const modules = LevelDataLoader.getAllModules();
      
      if (!modules || modules.length === 0) {
        throw new Error('Nessun modulo convertito');
      }
      
      // Verifica campi obbligatori
      const sampleModule = modules[0];
      const requiredFields = ['code', 'title', 'slug', 'description', 'category', 'type', 'difficulty'];
      const missingFields = requiredFields.filter(field => !sampleModule[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campi mancanti: ${missingFields.join(', ')}`);
      }
      
      // Verifica campi schema esteso
      const extendedFields = ['contentPath', 'skillTags', 'revisionDate', 'teachingArea'];
      const hasExtendedFields = extendedFields.every(field => sampleModule[field] !== undefined);
      
      this.results.schemaConversion = {
        success: true,
        modules: modules.length,
        sampleModule: sampleModule,
        hasExtendedFields: hasExtendedFields
      };
      
      console.log(`✅ Moduli convertiti: ${modules.length}`);
      console.log(`✅ Campi obbligatori: OK`);
      console.log(`✅ Campi schema esteso: ${hasExtendedFields ? 'OK' : 'Mancanti'}`);
      console.log(`\n   Esempio modulo:`);
      console.log(`   - Codice: ${sampleModule.code}`);
      console.log(`   - Titolo: ${sampleModule.title}`);
      console.log(`   - Categoria: ${sampleModule.category}`);
      console.log(`   - Area didattica: ${sampleModule.teachingArea}`);
      console.log(`   - Content Path: ${sampleModule.contentPath}`);
      
    } catch (error) {
      this.results.schemaConversion = {
        success: false,
        error: error.message
      };
      console.error(`❌ Fallito: ${error.message}`);
    }
  }

  /**
   * Test compatibilità migrazione
   */
  async testCompatibility() {
    console.log('\n3. TEST COMPATIBILITÀ MIGRAZIONE');
    console.log('--------------------------------');
    
    try {
      const compatibility = await LevelMigrationManager.checkCompatibility();
      
      this.results.compatibility = {
        success: true,
        data: compatibility
      };
      
      console.log(`✅ Migrazione raccomandata: ${compatibility.migrationRecommended ? 'SI' : 'NO'}`);
      console.log(`✅ Può migrare: ${compatibility.compatibility.canMigrate ? 'SI' : 'NO'}`);
      console.log(`✅ Perdita dati: ${compatibility.compatibility.dataLoss ? 'SI' : 'NO'}`);
      console.log(`✅ Nuovi moduli: ${compatibility.compatibility.newModules}`);
      
      if (compatibility.compatibility.dataLoss) {
        console.log(`\n   ⚠️  Attenzione: ${compatibility.details.comparison.uniqueToCurrentCodes.length} moduli esistenti non presenti nella nuova struttura`);
        console.log(`   Moduli unici attuali: ${compatibility.details.comparison.uniqueToCurrentCodes.join(', ')}`);
      }
      
      if (compatibility.compatibility.newModules > 0) {
        console.log(`\n   📚 Nuovi moduli disponibili: ${compatibility.compatibility.newModules}`);
        console.log(`   Moduli unici nuova struttura: ${compatibility.details.comparison.uniqueToLevelCodes.slice(0, 5).join(', ')}${compatibility.details.comparison.uniqueToLevelCodes.length > 5 ? '...' : ''}`);
      }
      
    } catch (error) {
      this.results.compatibility = {
        success: false,
        error: error.message
      };
      console.error(`❌ Fallito: ${error.message}`);
    }
  }

  /**
   * Test migrazione (opzionale)
   */
  async testMigration() {
    console.log('\n4. TEST MIGRAZIONE (Simulazione)');
    console.log('---------------------------------');
    
    try {
      // Simula migrazione senza effettuare cambiamenti permanenti
      const migrationNeeded = await LevelMigrationManager.needsLevelMigration();
      
      if (!migrationNeeded) {
        console.log('ℹ️  Migrazione non necessaria - struttura già aggiornata');
        this.results.migration = {
          success: true,
          needed: false,
          message: 'Struttura già aggiornata'
        };
        return;
      }
      
      // Mostra cosa accadrebbe con la migrazione
      const comparison = await LevelMigrationManager.compareStructures();
      
      this.results.migration = {
        success: true,
        needed: true,
        simulation: comparison
      };
      
      console.log(`✅ Migrazione necessaria: SI`);
      console.log(`\n   Moduli attuali: ${comparison.currentStructure.total}`);
      console.log(`   Moduli nuova struttura: ${comparison.levelStructure.total}`);
      console.log(`   Moduli in comune: ${comparison.comparison.common}`);
      console.log(`   Moduli da aggiungere: ${comparison.comparison.uniqueToLevel.length}`);
      console.log(`   Moduli potenzialmente persi: ${comparison.comparison.uniqueToCurrent.length}`);
      
      if (comparison.comparison.uniqueToCurrent.length === 0) {
        console.log(`\n   🎉 Migrazione sicura - nessun dato perso`);
      } else {
        console.log(`\n   ⚠️  Attenzione: ${comparison.comparison.uniqueToCurrent.length} moduli esistenti non presenti nella nuova struttura`);
      }
      
    } catch (error) {
      this.results.migration = {
        success: false,
        error: error.message
      };
      console.error(`❌ Fallito: ${error.message}`);
    }
  }

  /**
   * Stampa riepilogo test
   */
  printSummary() {
    console.log('\n📊 RIEPILOGO TEST');
    console.log('================');
    
    const tests = [
      { name: 'Caricamento dati livello', result: this.results.levelLoading },
      { name: 'Conversione schema esteso', result: this.results.schemaConversion },
      { name: 'Compatibilità migrazione', result: this.results.compatibility },
      { name: 'Test migrazione', result: this.results.migration }
    ];
    
    tests.forEach(test => {
      const status = test.result?.success ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
    });
    
    // Raccomandazioni
    console.log('\n💡 RACCOMANDAZIONI:');
    
    if (this.results.compatibility?.data?.migrationRecommended) {
      if (this.results.compatibility.data.compatibility.canMigrate) {
        console.log('✅ È possibile eseguire la migrazione completa senza perdita di dati');
      } else {
        console.log('⚠️  Considera la migrazione incrementale per preservare i dati esistenti');
      }
    } else {
      console.log('ℹ️  La struttura è già aggiornata o non necessita migrazione');
    }
  }

  /**
   * Esegue migrazione completa (solo su esplicita richiesta)
   */
  async executeMigration() {
    console.log('\n🚀 ESECUZIONE MIGRAZIONE COMPLETA');
    console.log('=================================');
    
    try {
      const result = await LevelMigrationManager.migrateToLevelStructure();
      
      if (result.success) {
        console.log('✅ Migrazione completata con successo!');
        console.log(`\n📊 Risultati:`);
        console.log(`   - Moduli importati: ${result.modulesImported}`);
        console.log(`   - Dipendenze create: ${result.dependenciesCreated}`);
        console.log(`   - Livelli: ${result.levelStructure.levels}`);
        console.log(`   - Aree didattiche: ${result.levelStructure.teachingAreas.join(', ')}`);
      } else {
        console.error(`❌ Migrazione fallita: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Errore durante la migrazione:', error);
      throw error;
    }
  }
}

// Crea istanza globale per testing
window.ModularStructureTester = new ModularStructureTester();

// Esegui test automaticamente se richiesto
if (window.runModularTests) {
  window.ModularStructureTester.runAllTests();
}

export default ModularStructureTester;