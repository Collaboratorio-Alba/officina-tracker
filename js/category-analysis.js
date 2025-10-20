/**
 * Category Analysis Tool
 * Analyzes current module structure and designs meaningful category taxonomy
 */

class CategoryAnalyzer {
  constructor() {
    this.modules = [];
    this.categoryStats = {};
    this.skillTagStats = {};
    this.proposedCategories = {};
  }

  /**
   * Load all modules from all levels
   */
  async loadAllModules() {
    const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    
    for (const level of levels) {
      try {
        const response = await fetch(`./js/data/ciclofficina_level${level}.json`);
        if (!response.ok) continue;
        
        const data = await response.json();
        let modules = [];
        
        if (data.courses) {
          // Level 1 structure
          modules = data.courses[0].teachingAreas[0].modules || [];
        } else if (data.modules) {
          // Other levels structure
          modules = data.modules;
        }
        
        modules.forEach(module => {
          module.level = level;
          module.teachingArea = data.teachingArea?.name || 'Fondamenti Teorici Base';
          this.modules.push(module);
        });
        
      } catch (error) {
        console.warn(`⚠️ Could not load level ${level}:`, error.message);
      }
    }
    
    console.log(`✅ Loaded ${this.modules.length} modules from 11 levels`);
  }

  /**
   * Analyze current category usage
   */
  analyzeCurrentCategories() {
    const currentCategories = {};
    
    this.modules.forEach(module => {
      // Analyze skill tags for categorization patterns
      const skillTags = module.skillTags || [];
      skillTags.forEach(tag => {
        currentCategories[tag] = (currentCategories[tag] || 0) + 1;
      });
      
      // Analyze teaching areas
      const teachingArea = module.teachingArea;
      currentCategories[teachingArea] = (currentCategories[teachingArea] || 0) + 1;
    });
    
    this.categoryStats = currentCategories;
    return currentCategories;
  }

  /**
   * Analyze skill tag patterns
   */
  analyzeSkillTags() {
    const skillStats = {};
    
    this.modules.forEach(module => {
      const skillTags = module.skillTags || [];
      skillTags.forEach(tag => {
        skillStats[tag] = (skillStats[tag] || 0) + 1;
      });
    });
    
    this.skillTagStats = skillStats;
    return skillStats;
  }

  /**
   * Design meaningful category taxonomy
   */
  designCategoryTaxonomy() {
    const taxonomy = {
      // Core bike systems
      'frame-fork': {
        name: 'Telaio e Forcella',
        description: 'Struttura principale della bicicletta',
        modules: [],
        keywords: ['telaio', 'forcella', 'materiali', 'strutturale', 'recupero']
      },
      'wheels-tires': {
        name: 'Ruote e Pneumatici',
        description: 'Sistema ruote, mozzi, pneumatici e camere d\'aria',
        modules: [],
        keywords: ['ruote', 'mozzi', 'pneumatici', 'camera-aria', 'centratura']
      },
      'braking-system': {
        name: 'Sistema Frenante',
        description: 'Freni a pattino, disco e meccanismi di arresto',
        modules: [],
        keywords: ['freni', 'pattini', 'disco', 'cavi-freni', 'sicurezza']
      },
      'drivetrain': {
        name: 'Trasmissione',
        description: 'Catena, pignoni, corone, cambio e deragliatori',
        modules: [],
        keywords: ['trasmissione', 'catena', 'cambio', 'deragliatore', 'pedali']
      },
      'steering-system': {
        name: 'Sistema Sterzo',
        description: 'Serie sterzo, manubrio e componenti di direzione',
        modules: [],
        keywords: ['sterzo', 'manubrio', 'serie-sterzo', 'forcella']
      },
      
      // Maintenance types
      'diagnostic-assessment': {
        name: 'Diagnosi e Valutazione',
        description: 'Ispezione, verifica e valutazione dello stato',
        modules: [],
        keywords: ['diagnosi', 'valutazione', 'ispezione', 'verifica', 'assessment']
      },
      'maintenance-repair': {
        name: 'Manutenzione e Riparazione',
        description: 'Interventi di pulizia, regolazione e riparazione',
        modules: [],
        keywords: ['manutenzione', 'riparazione', 'pulizia', 'regolazione', 'lubrificazione']
      },
      'assembly-installation': {
        name: 'Assemblaggio e Installazione',
        description: 'Montaggio e installazione componenti',
        modules: [],
        keywords: ['montaggio', 'assemblaggio', 'installazione', 'compatibilità']
      },
      
      // Skill domains
      'tools-techniques': {
        name: 'Strumenti e Tecniche',
        description: 'Uso strumenti e tecniche di lavoro',
        modules: [],
        keywords: ['strumenti', 'tecniche', 'prevenzione-danni', 'recupero', 'trucchi']
      },
      'safety-standards': {
        name: 'Sicurezza e Standard',
        description: 'Norme di sicurezza e standard tecnici',
        modules: [],
        keywords: ['sicurezza', 'standard', 'prevenzione', 'coppia', 'filettature']
      },
      'theory-knowledge': {
        name: 'Teoria e Conoscenza',
        description: 'Principi teorici e conoscenza base',
        modules: [],
        keywords: ['teoria', 'terminologia', 'classificazione', 'nomenclatura']
      },
      
      // Specialized areas
      'materials-chemistry': {
        name: 'Materiali e Chimica',
        description: 'Materiali, lubrificanti e prodotti chimici',
        modules: [],
        keywords: ['materiali', 'lubrificazione', 'sgrassatori', 'anti-corrosione']
      },
      'workshop-management': {
        name: 'Gestione Officina',
        description: 'Organizzazione e gestione dello spazio di lavoro',
        modules: [],
        keywords: ['organizzazione', 'gestione', 'officina', 'documentazione']
      },
      'community-collaboration': {
        name: 'Comunità e Collaborazione',
        description: 'Lavoro di gruppo e approccio comunitario',
        modules: [],
        keywords: ['comunità', 'collaborazione', 'certificazione', 'condivisione']
      }
    };

    // Categorize each module
    this.modules.forEach(module => {
      const moduleCategories = this.categorizeModule(module, taxonomy);
      moduleCategories.forEach(categoryId => {
        taxonomy[categoryId].modules.push(module.id);
      });
    });

    this.proposedCategories = taxonomy;
    return taxonomy;
  }

  /**
   * Categorize a single module
   */
  categorizeModule(module, taxonomy) {
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
   * Generate category mapping for modules
   */
  generateCategoryMapping() {
    const mapping = {};
    
    this.modules.forEach(module => {
      const categories = this.categorizeModule(module, this.proposedCategories);
      mapping[module.id] = {
        primary: categories[0] || 'maintenance-repair',
        secondary: categories.slice(1)
      };
    });
    
    return mapping;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const currentCategories = this.analyzeCurrentCategories();
    const skillTags = this.analyzeSkillTags();
    const taxonomy = this.designCategoryTaxonomy();
    const mapping = this.generateCategoryMapping();

    console.log('📊 CATEGORY ANALYSIS REPORT');
    console.log('===========================');
    console.log(`Total Modules: ${this.modules.length}`);
    console.log(`Unique Skill Tags: ${Object.keys(skillTags).length}`);
    console.log(`Proposed Categories: ${Object.keys(taxonomy).length}`);
    
    console.log('\n📋 CURRENT CATEGORY USAGE (Top 20):');
    const sortedCurrent = Object.entries(currentCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    sortedCurrent.forEach(([category, count]) => {
      console.log(`  ${category}: ${count} modules`);
    });

    console.log('\n🔧 PROPOSED CATEGORY TAXONOMY:');
    Object.entries(taxonomy).forEach(([id, category]) => {
      console.log(`\n${category.name} (${id}):`);
      console.log(`  Description: ${category.description}`);
      console.log(`  Modules: ${category.modules.length}`);
      console.log(`  Keywords: ${category.keywords.join(', ')}`);
    });

    console.log('\n📈 CATEGORY DISTRIBUTION:');
    Object.entries(taxonomy).forEach(([id, category]) => {
      const percentage = ((category.modules.length / this.modules.length) * 100).toFixed(1);
      console.log(`  ${category.name}: ${category.modules.length} modules (${percentage}%)`);
    });

    return {
      totalModules: this.modules.length,
      currentCategories,
      skillTags,
      taxonomy,
      mapping
    };
  }

  /**
   * Run complete analysis
   */
  async runAnalysis() {
    console.log('🔍 Starting category analysis...');
    await this.loadAllModules();
    return this.generateReport();
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.CategoryAnalyzer = CategoryAnalyzer;
}

// Run analysis if called directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryAnalyzer;
}