/**
 * Test Script per Schema Esteso 1.1.0
 * Verifica integrazione con nuovo schema Typemill
 */

import db from './database/db-config.js';
import ModuleManager from './database/module-manager.js';
import ProgressManager from './database/progress-manager.js';
import MigrationManager from './database/migration-manager.js';

async function testExtendedSchema() {
  console.log('🧪 TEST SCHEMA ESTESO 1.1.0');
  console.log('==============================');
  
  try {
    // 1. Verifica database
    await db.open();
    console.log('✅ Database pronto');
    
    // 2. Test migrazione (se necessaria)
    const needsMigration = await MigrationManager.needsMigration();
    console.log(`🔄 Migrazione necessaria: ${needsMigration}`);
    
    if (needsMigration) {
      console.log('🔄 Eseguo migrazione...');
      const migrationResult = await MigrationManager.migrateToExtendedSchema();
      console.log('✅ Migrazione completata:', migrationResult);
    }
    
    // 3. Test nuovi campi
    console.log('\n📊 TEST NUOVI CAMPI:');
    
    // Skill Tags
    const allTags = await ModuleManager.getAllSkillTags();
    console.log(`🏷️  Skill Tags totali: ${allTags.length}`);
    console.log('   Tags:', allTags);
    
    // Content Path
    const modules = await ModuleManager.getAllModules();
    const modulesWithContentPath = modules.filter(m => m.contentPath);
    console.log(`📁 Moduli con contentPath: ${modulesWithContentPath.length}/${modules.length}`);
    
    // Revision Date
    const needsRevision = await ModuleManager.getModulesNeedingRevision(30);
    console.log(`📅 Moduli da revisionare: ${needsRevision.length}`);
    
    // 4. Test Progress Manager esteso
    console.log('\n📈 TEST PROGRESS MANAGER ESTESO:');
    
    const extendedStats = await ProgressManager.getExtendedStats();
    console.log(`📊 Statistiche estese:`);
    console.log(`   - Moduli totali: ${extendedStats.total}`);
    console.log(`   - Copertura content: ${extendedStats.contentCoverage}`);
    console.log(`   - Skill tags unici: ${Object.keys(extendedStats.skillTagStats).length}`);
    
    // 5. Test funzionalità specifiche
    console.log('\n🔧 TEST FUNZIONALITÀ SPECIFICHE:');
    
    // Moduli disponibili
    const availableModules = await ProgressManager.getAvailableModules();
    console.log(`📚 Moduli disponibili: ${availableModules.length}`);
    
    // Moduli completati con content
    const completedWithContent = await ProgressManager.getCompletedModulesWithContent();
    console.log(`✅ Moduli completati con content: ${completedWithContent.length}`);
    
    // 6. Test integrazione Typemill
    console.log('\n🌐 TEST INTEGRAZIONE TYPEMILL:');
    
    if (modulesWithContentPath.length > 0) {
      const sampleModule = modulesWithContentPath[0];
      const contentUrl = await ProgressManager.navigateToModuleContent(sampleModule.id);
      console.log(`🔗 URL contenuto esempio: ${contentUrl}`);
      console.log(`   Modulo: ${sampleModule.title}`);
      console.log(`   Content Path: ${sampleModule.contentPath}`);
      console.log(`   Skill Tags: ${sampleModule.skillTags?.join(', ') || 'Nessuno'}`);
    }
    
    // 7. Test ricerca per skill tag
    console.log('\n🔍 TEST RICERCA PER SKILL TAG:');
    
    if (allTags.length > 0) {
      const sampleTag = allTags[0];
      const modulesByTag = await ModuleManager.getModulesBySkillTag(sampleTag);
      console.log(`🔍 Moduli con tag "${sampleTag}": ${modulesByTag.length}`);
    }
    
    console.log('\n🎉 TEST COMPLETATO CON SUCCESSO!');
    console.log('==============================');
    
    return {
      success: true,
      modules: modules.length,
      modulesWithContentPath: modulesWithContentPath.length,
      skillTags: allTags.length,
      availableModules: availableModules.length,
      contentCoverage: extendedStats.contentCoverage
    };
    
  } catch (error) {
    console.error('❌ ERRORE DURANTE IL TEST:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Esegui test se richiamato direttamente
if (import.meta.url === `file://${window.location.href}`) {
  testExtendedSchema().then(result => {
    console.log('📋 RISULTATO FINALE:', result);
  });
}

// Export per uso esterno
export default testExtendedSchema;