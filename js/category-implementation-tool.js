/**
 * Category Implementation Tool
 * Adds meaningful category fields to module definitions across all levels
 */

import fs from 'fs';
import path from 'path';

class CategoryImplementationTool {
  constructor() {
    this.modules = [];
    this.categoryMapping = {};
  }

  /**
   * Load all modules and generate category mapping
   */
  async loadAndAnalyze() {
    const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    
    for (const level of levels) {
      try {
        const filePath = path.join(process.cwd(), 'js/data', `ciclofficina_level${level}.json`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let modules = [];
        
        if (data.courses) {
          modules = data.courses[0].teachingAreas[0].modules || [];
        } else if (data.modules) {
          modules = data.modules;
        }
        
        modules.forEach(module => {
          module.level = level;
          module.teachingArea = data.teachingArea?.name || 'Fondamenti Teorici Base';
          module.filePath = filePath;
          this.modules.push(module);
        });
        
      } catch (error) {
        console.warn(`⚠️ Could not load level ${level}:`, error.message);
      }
    }
    
    console.log(`✅ Loaded ${this.modules.length} modules from 11 levels`);
    
    // Generate category mapping
    this.generateCategoryMapping();
  }

  /**
   * Generate category mapping based on module content
   */
  generateCategoryMapping() {
    const mapping = {};
    
    this.modules.forEach(module => {
      const categories = this.categorizeModule(module);
      mapping[module.id] = {
        primary: categories[0] || 'maintenance-repair',
        secondary: categories.slice(1)
      };
    });
    
    this.categoryMapping = mapping;
    return mapping;
  }

  /**
   * Categorize a single module
   */
  categorizeModule(module) {
    const categories = new Set();
    const title = module.title.toLowerCase();
    const description = module.description.toLowerCase();
    const skillTags = (module.skillTags || []).map(tag => tag.toLowerCase());

    // Core bike systems
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['telaio', 'forcella', 'materiali', 'strutturale', 'recupero'])) {
      categories.add('frame-fork');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['ruote', 'mozzi', 'pneumatici', 'camera-aria', 'centratura', 'raggi'])) {
      categories.add('wheels-tires');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['freni', 'pattini', 'disco', 'cavi-freni', 'sicurezza', 'frenata'])) {
      categories.add('braking-system');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['trasmissione', 'catena', 'cambio', 'deragliatore', 'pedali', 'pignoni', 'corone'])) {
      categories.add('drivetrain');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['sterzo', 'manubrio', 'serie-sterzo', 'forcella', 'precarico'])) {
      categories.add('steering-system');
    }

    // Maintenance types
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['diagnosi', 'valutazione', 'ispezione', 'verifica', 'assessment', 'controllo'])) {
      categories.add('diagnostic-assessment');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['manutenzione', 'riparazione', 'pulizia', 'regolazione', 'lubrificazione', 'ingrassaggio'])) {
      categories.add('maintenance-repair');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['montaggio', 'assemblaggio', 'installazione', 'compatibilità', 'collaudo'])) {
      categories.add('assembly-installation');
    }

    // Skill domains
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['strumenti', 'tecniche', 'prevenzione-danni', 'recupero', 'trucchi', 'chiavi'])) {
      categories.add('tools-techniques');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['sicurezza', 'standard', 'prevenzione', 'coppia', 'filettature', 'misurazione'])) {
      categories.add('safety-standards');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['teoria', 'terminologia', 'classificazione', 'nomenclatura', 'principi'])) {
      categories.add('theory-knowledge');
    }

    // Specialized areas
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['materiali', 'lubrificazione', 'sgrassatori', 'anti-corrosione', 'grasso', 'olio'])) {
      categories.add('materials-chemistry');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['organizzazione', 'gestione', 'officina', 'documentazione', 'registro'])) {
      categories.add('workshop-management');
    }
    
    if (this.matchesKeywords(title + description + skillTags.join(' '), 
        ['comunità', 'collaborazione', 'certificazione', 'condivisione', 'pop', 'solidale'])) {
      categories.add('community-collaboration');
    }

    // Ensure at least one category
    if (categories.size === 0) {
      categories.add('maintenance-repair'); // Default category
    }

    return Array.from(categories);
  }

  /**
   * Check if text matches any keywords
   */
  matchesKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Implement categories in module definitions
   */
  async implementCategories() {
    console.log('🔧 Implementing categories in module definitions...');
    
    const levelFiles = {};
    
    // Group modules by file
    this.modules.forEach(module => {
      if (!levelFiles[module.filePath]) {
        levelFiles[module.filePath] = [];
      }
      levelFiles[module.filePath].push(module);
    });
    
    let totalUpdated = 0;
    
    // Update each file
    for (const [filePath, modules] of Object.entries(levelFiles)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let updated = false;
        
        if (data.courses) {
          // Level 1 structure
          data.courses[0].teachingAreas[0].modules.forEach(module => {
            const mapping = this.categoryMapping[module.id];
            if (mapping) {
              module.category = mapping.primary;
              module.categories = mapping.secondary;
              updated = true;
              totalUpdated++;
            }
          });
        } else if (data.modules) {
          // Other levels structure
          data.modules.forEach(module => {
            const mapping = this.categoryMapping[module.id];
            if (mapping) {
              module.category = mapping.primary;
              module.categories = mapping.secondary;
              updated = true;
              totalUpdated++;
            }
          });
        }
        
        if (updated) {
          // Write updated file
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
          console.log(`✅ Updated categories in ${path.basename(filePath)}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully updated categories for ${totalUpdated} modules across 11 levels`);
    return totalUpdated;
  }

  /**
   * Generate category summary report
   */
  generateSummaryReport() {
    const categoryStats = {};
    
    Object.values(this.categoryMapping).forEach(mapping => {
      const primary = mapping.primary;
      categoryStats[primary] = (categoryStats[primary] || 0) + 1;
      
      mapping.secondary.forEach(secondary => {
        categoryStats[secondary] = (categoryStats[secondary] || 0) + 1;
      });
    });
    
    console.log('\n📊 CATEGORY IMPLEMENTATION SUMMARY');
    console.log('=================================');
    console.log(`Total Modules: ${this.modules.length}`);
    console.log(`Categories Applied: ${Object.keys(categoryStats).length}`);
    
    console.log('\n📈 CATEGORY DISTRIBUTION:');
    Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        const percentage = ((count / this.modules.length) * 100).toFixed(1);
        console.log(`  ${category}: ${count} modules (${percentage}%)`);
      });
    
    return categoryStats;
  }

  /**
   * Run complete implementation
   */
  async runImplementation() {
    console.log('🚀 Starting category implementation...');
    await this.loadAndAnalyze();
    await this.implementCategories();
    return this.generateSummaryReport();
  }
}

// Run implementation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tool = new CategoryImplementationTool();
  tool.runImplementation().then(report => {
    console.log('\n🎉 Category implementation completed successfully!');
  }).catch(error => {
    console.error('❌ Category implementation failed:', error);
  });
}

export default CategoryImplementationTool;