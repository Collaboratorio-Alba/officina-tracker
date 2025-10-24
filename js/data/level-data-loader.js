/**
 * Level Data Loader
 * Gestione del caricamento modulare dei dati per struttura a livelli
 * Migrazione da files monolitici a struttura modulare per ciclofficina
 */

class LevelDataLoader {
  constructor() {
    this.levels = [];
    this.courses = [];
    this.modules = [];
    this.loaded = false;
  }

  /**
   * Carica tutti i file di livello disponibili
   * @returns {Promise<boolean>}
   */
  async loadAllLevels() {
    try {
      console.log('📚 Caricamento struttura modulare a livelli...');
      
      // Lista dei file di livello disponibili (dinamica)
      const levelFiles = await this.discoverLevelFiles();

      this.levels = [];
      this.courses = [];
      this.modules = [];

      // Carica ogni file di livello
      for (const levelFile of levelFiles) {
        try {
          const levelData = await this.loadLevelFile(levelFile);
          if (levelData) {
            this.processLevelData(levelData, levelFile);
          }
        } catch (error) {
          console.warn(`⚠️ Impossibile caricare ${levelFile}:`, error.message);
        }
      }

      // Crea struttura corsi unificata
      this.createUnifiedCourseStructure();
      
      this.loaded = true;
      console.log(`✅ Struttura modulare caricata: ${this.levels.length} livelli, ${this.modules.length} moduli`);
      
      return true;
    } catch (error) {
      console.error('❌ Errore caricamento struttura modulare:', error);
      throw error;
    }
  }

  /**
   * Scopre dinamicamente i file di livello disponibili
   * @returns {Promise<Array>}
   */
  async discoverLevelFiles() {
    try {
      // Carica la lista dei file dal server
      const response = await fetch('./js/data/');
      if (!response.ok) {
        throw new Error('Impossibile caricare la lista dei file');
      }
      
      // In un ambiente browser, non possiamo leggere direttamente la directory
      // Quindi usiamo un approccio alternativo: proviamo a caricare i file in sequenza
      const maxLevels = 20; // Limite ragionevole per evitare loop infiniti
      const levelFiles = [];
      
      for (let i = 0; i <= maxLevels; i++) {
        const filename = `ciclofficina_level${i}.json`;
        try {
          const testResponse = await fetch(`./js/data/${filename}`);
          if (testResponse.ok) {
            levelFiles.push(filename);
          }
        } catch (error) {
          // Continua con il prossimo livello
          break;
        }
      }
      
      return levelFiles;
    } catch (error) {
      console.warn('⚠️ Impossibile scoprire file dinamicamente, usando lista predefinita:', error.message);
      // Fallback a lista predefinita
      return [
        'ciclofficina_level0.json',
        'ciclofficina_level1.json',
        'ciclofficina_level2.json',
        'ciclofficina_level3.json',
        'ciclofficina_level4.json',
        'ciclofficina_level5.json',
        'ciclofficina_level6.json',
        'ciclofficina_level7.json',
        'ciclofficina_level8.json',
        'ciclofficina_level9.json',
        'ciclofficina_level10.json',
        'ciclofficina_level11.json',
        'ciclofficina_level12.json'
      ];
    }
  }

  /**
   * Carica un singolo file di livello
   * @param {string} filename
   * @returns {Promise<Object>}
   */
  async loadLevelFile(filename) {
    const response = await fetch(`./js/data/${filename}`);
    if (!response.ok) {
      throw new Error(`File ${filename} non trovato`);
    }
    return await response.json();
  }

  /**
   * Processa i dati di un livello
   * @param {Object} levelData 
   * @param {string} filename 
   */
  processLevelData(levelData, filename) {
    // Estrai numero livello dal filename
    const levelMatch = filename.match(/level(\d+)/);
    const levelNumber = levelMatch ? parseInt(levelMatch[1]) : this.levels.length + 1;

    let levelInfo = {
      level: levelNumber,
      filename: filename,
      teachingArea: null,
      modules: []
    };

    // Gestione struttura diversa per livello 1 vs altri livelli
    if (levelData.courses) {
      // Struttura livello 1 (contenente corso completo)
      const course = levelData.courses[0];
      if (course && course.teachingAreas) {
        const teachingArea = course.teachingAreas[0];
        levelInfo.teachingArea = {
          name: teachingArea.name,
          description: teachingArea.description,
          color: teachingArea.color
        };
        levelInfo.modules = teachingArea.modules || [];
        
        // Salva info corso dal livello 1
        if (levelNumber === 1) {
          this.courses.push({
            id: course.id,
            title: course.title,
            description: course.description
          });
        }
      }
    } else if (levelData.teachingArea) {
      // Struttura altri livelli (teachingArea diretta)
      levelInfo.teachingArea = {
        name: levelData.teachingArea.name,
        description: levelData.teachingArea.description,
        color: levelData.teachingArea.color
      };
      levelInfo.modules = levelData.modules || [];
    }

    // Processa moduli del livello
    if (levelInfo.modules.length > 0) {
      const processedModules = levelInfo.modules.map(module => ({
        ...module,
        level: levelNumber,
        teachingArea: levelInfo.teachingArea.name
      }));
      
      this.modules.push(...processedModules);
    }

    this.levels.push(levelInfo);
  }

  /**
   * Crea struttura corsi unificata
   */
  createUnifiedCourseStructure() {
    if (this.courses.length === 0 && this.levels.length > 0) {
      // Crea corso base se non presente
      this.courses.push({
        id: 'ciclofficina-basics',
        title: 'Manutenzione e Riparazione Biciclette',
        description: 'Percorso didattico completo di formazione in ciclofficina popolare'
      });
    }

    // Aggiungi aree didattiche dai livelli
    const course = this.courses[0];
    if (course) {
      course.teachingAreas = this.levels.map(level => ({
        name: level.teachingArea.name,
        description: level.teachingArea.description,
        color: level.teachingArea.color,
        modules: level.modules.map(m => m.id)
      }));
    }
  }

  /**
   * Recupera tutti i moduli in formato compatibile con schema esteso
   * @returns {Array}
   */
  getAllModules() {
    return this.modules.map(module => this.convertToExtendedSchema(module));
  }

  /**
   * Converte modulo da formato livello a schema esteso
   * @param {Object} module
   * @returns {Object}
   */
  convertToExtendedSchema(module) {
    return {
      code: module.id,
      title: module.title,
      slug: this.generateSlug(module.title),
      description: module.description,
      type: 'presenza', // Default per moduli pratici
      difficulty: module.difficulty || 'base',
      contentPath: module.contentPath || this.generateContentPath(module),
      skillTags: module.skillTags || [],
      revisionDate: module.revisionDate || new Date().toISOString().split('T')[0],
      prerequisites: this.mapPrerequisites(module.dependencies),
      estimatedDuration: module.estimatedDuration || 60,
      toolsRequired: module.toolsRequired || [],
      learningOutcomes: module.learningOutcomes || [],
      practicalCriteria: this.mapPracticalCriteria(module),
      teachingArea: module.teachingArea
    };
  }

  /**
   * Genera slug da titolo
   * @param {string} title 
   * @returns {string}
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Genera content path automatico
   * @param {Object} module 
   * @returns {string}
   */
  generateContentPath(module) {
    const courseSlug = 'ciclofficina-basics';
    const areaSlug = this.generateSlug(module.teachingArea);
    const moduleSlug = module.slug || this.generateSlug(module.title);
    
    return `/${courseSlug}/${areaSlug}/${moduleSlug}`;
  }


  /**
   * Mappa dipendenze in prerequisiti
   * @param {Array} dependencies 
   * @returns {Array}
   */
  mapPrerequisites(dependencies) {
    if (!dependencies || !Array.isArray(dependencies)) {
      return [];
    }
    
    return dependencies
      .filter(dep => dep.type === 'mandatory')
      .map(dep => dep.moduleId);
  }

  /**
   * Mappa criteri pratici
   * @param {Object} module 
   * @returns {Object}
   */
  mapPracticalCriteria(module) {
    if (Array.isArray(module.practicalCriteria)) {
      return {
        description: module.practicalCriteria.join(', '),
        requiredSkills: module.skillTags || [],
        assessmentMethod: 'pratica-supervisionata',
        qualityMetrics: module.practicalCriteria
      };
    }
    
    return {
      description: module.practicalCriteria?.description || 'Valutazione pratica supervisionata',
      requiredSkills: module.practicalCriteria?.requiredSkills || module.skillTags || [],
      assessmentMethod: module.practicalCriteria?.assessmentMethod || 'pratica-supervisionata',
      qualityMetrics: module.practicalCriteria?.qualityMetrics || ['Esecuzione corretta della procedura']
    };
  }

  /**
   * Recupera statistiche della struttura modulare
   * @returns {Object}
   */
  getStats() {
    return {
      levels: this.levels.length,
      courses: this.courses.length,
      modules: this.modules.length,
      modulesByLevel: this.levels.reduce((acc, level) => {
        acc[level.level] = level.modules.length;
        return acc;
      }, {}),
      teachingAreas: this.levels.map(level => level.teachingArea.name)
    };
  }

  /**
   * Verifica se i dati sono stati caricati
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Recupera struttura corsi in formato compatibile
   * @returns {Object}
   */
  getCourseStructure() {
    if (this.courses.length === 0) {
      return null;
    }

    return {
      version: "1.1.0",
      schemaNotes: "Schema modulare per ciclofficina popolare - Migrazione da struttura a livelli",
      courses: this.courses
    };
  }
}

// Export singleton instance
export default new LevelDataLoader();
