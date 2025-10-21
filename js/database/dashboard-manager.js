/**
 * Dashboard Manager
 * Gestione dati per dashboard con heatmap aree didattiche e timeline progressi
 * Schema Esteso 1.1.0 - Integrazione con struttura modulare a livelli
 */

import db from './db-config.js';
import LevelDataLoader from '../data/level-data-loader.js';
import DependencyManager from './dependency-manager.js';

class DashboardManager {
  constructor() {
    this.db = db;
    this.dependencyManager = DependencyManager;
  }

  /**
   * Recupera statistiche per heatmap aree didattiche
   * @returns {Promise<Object>}
   */
  async getTeachingAreaStats() {
    try {
      const [modules, progressRecords] = await Promise.all([
        this.db.modules.toArray(),
        this.db.progress.toArray()
      ]);

      const progressMap = new Map(
        progressRecords.map(p => [p.moduleId, p.status])
      );

      // Carica struttura modulare per ottenere aree didattiche e colori
      await LevelDataLoader.loadAllLevels();
      const levelStats = LevelDataLoader.getStats();
      const teachingAreas = levelStats.teachingAreas;

      const areaStats = {};

      teachingAreas.forEach(areaName => {
        const areaModules = modules.filter(m => m.teachingArea === areaName);
        const totalModules = areaModules.length;
        
        const completed = areaModules.filter(m => 
          progressMap.get(m.id) === 'completed'
        ).length;
        
        const inProgress = areaModules.filter(m => 
          progressMap.get(m.id) === 'in-progress'
        ).length;

        const completionPercentage = totalModules > 0 
          ? Math.round((completed / totalModules) * 100)
          : 0;

        // Trova colore dell'area didattica dai dati di livello
        const levelInfo = LevelDataLoader.levels.find(level => 
          level.teachingArea.name === areaName
        );
        const areaColor = levelInfo?.teachingArea.color || '#8000E5';

        areaStats[areaName] = {
          name: areaName,
          totalModules,
          completed,
          inProgress,
          notStarted: totalModules - completed - inProgress,
          completionPercentage,
          color: areaColor,
          level: levelInfo?.level || 1
        };
      });

      return areaStats;
    } catch (error) {
      console.error('❌ Errore recupero statistiche aree didattiche:', error);
      throw error;
    }
  }

  /**
   * Recupera dati per timeline progressi
   * @returns {Promise<Array>}
   */
  async getTimelineData() {
    try {
      const progressRecords = await this.db.progress
        .where('status').equals('completed')
        .and(p => p.completionDate !== null)
        .toArray();

      const modules = await this.db.modules.toArray();
      const moduleMap = new Map(modules.map(m => [m.id, m]));

      // Raggruppa completamenti per data
      const timelineMap = new Map();

      progressRecords.forEach(progress => {
        if (!progress.completionDate) return;

        const date = progress.completionDate.split('T')[0]; // Solo data, senza ora
        const module = moduleMap.get(progress.moduleId);

        if (!timelineMap.has(date)) {
          timelineMap.set(date, {
            date,
            modules: [],
            count: 0
          });
        }

        const dayData = timelineMap.get(date);
        dayData.modules.push({
          id: module.id,
          title: module.title,
          teachingArea: module.teachingArea,
          completionDate: progress.completionDate
        });
        dayData.count = dayData.modules.length;
      });

      // Converti in array e ordina per data
      const timelineData = Array.from(timelineMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calcola progresso cumulativo
      let cumulativeCount = 0;
      const totalModules = modules.length;

      timelineData.forEach(day => {
        cumulativeCount += day.count;
        day.cumulativePercentage = totalModules > 0 
          ? Math.round((cumulativeCount / totalModules) * 100)
          : 0;
        day.cumulativeCount = cumulativeCount;
      });

      return {
        timeline: timelineData,
        totalModules,
        totalCompleted: cumulativeCount,
        overallPercentage: totalModules > 0 
          ? Math.round((cumulativeCount / totalModules) * 100)
          : 0
      };
    } catch (error) {
      console.error('❌ Errore recupero dati timeline:', error);
      throw error;
    }
  }

  /**
   * Recupera statistiche generali dashboard
   * @returns {Promise<Object>}
   */
  async getDashboardStats() {
    try {
      const [modules, progressRecords] = await Promise.all([
        this.db.modules.toArray(),
        this.db.progress.toArray()
      ]);

      const progressMap = new Map(
        progressRecords.map(p => [p.moduleId, p.status])
      );

      const totalModules = modules.length;
      const completed = modules.filter(m => 
        progressMap.get(m.id) === 'completed'
      ).length;
      const inProgress = modules.filter(m => 
        progressMap.get(m.id) === 'in-progress'
      ).length;
      const notStarted = totalModules - completed - inProgress;

      const completionPercentage = totalModules > 0 
        ? Math.round((completed / totalModules) * 100)
        : 0;

      // Calcola velocità di completamento (moduli/settimana)
      const completedProgress = progressRecords.filter(p => 
        p.status === 'completed' && p.completionDate
      );
      
      let completionVelocity = 0;
      if (completedProgress.length > 1) {
        const dates = completedProgress
          .map(p => new Date(p.completionDate))
          .sort((a, b) => a - b);
        
        const timeSpanWeeks = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24 * 7);
        completionVelocity = timeSpanWeeks > 0 
          ? Math.round(completedProgress.length / timeSpanWeeks)
          : completedProgress.length;
      }

      // Recupera completamenti recenti (ultima settimana)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentCompletions = completedProgress
        .filter(p => new Date(p.completionDate) > oneWeekAgo)
        .length;

      return {
        totalModules,
        completed,
        inProgress,
        notStarted,
        completionPercentage,
        completionVelocity,
        recentCompletions,
        estimatedCompletion: completionVelocity > 0 
          ? Math.round(notStarted / completionVelocity)
          : null // settimane stimate per completamento
      };
    } catch (error) {
      console.error('❌ Errore recupero statistiche dashboard:', error);
      throw error;
    }
  }

  /**
   * Recupera tutti i dati dashboard in una singola chiamata
   * @returns {Promise<Object>}
   */
  async getDashboardData() {
    try {
      const [areaStats, timelineData, dashboardStats] = await Promise.all([
        this.getTeachingAreaStats(),
        this.getTimelineData(),
        this.getDashboardStats()
      ]);

      return {
        areaStats,
        timelineData,
        dashboardStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Errore recupero dati dashboard:', error);
      throw error;
    }
  }

  /**
   * Filtra timeline per intervallo di date
   * @param {Array} timelineData 
   * @param {string} startDate 
   * @param {string} endDate 
   * @returns {Array}
   */
  filterTimelineByDate(timelineData, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return timelineData.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= start && dayDate <= end;
    });
  }

  /**
   * Recupera aree didattiche con progresso più basso
   * @param {Object} areaStats 
   * @param {number} limit 
   * @returns {Array}
   */
  getAreasNeedingAttention(areaStats, limit = 3) {
    return Object.values(areaStats)
      .filter(area => area.completionPercentage < 50)
      .sort((a, b) => a.completionPercentage - b.completionPercentage)
      .slice(0, limit);
  }

  /**
   * Recupera aree didattiche con progresso migliore
   * @param {Object} areaStats
   * @param {number} limit
   * @returns {Array}
   */
  getTopPerformingAreas(areaStats, limit = 3) {
    return Object.values(areaStats)
      .filter(area => area.completionPercentage > 0)
      .sort((a, b) => b.completionPercentage - a.completionPercentage)
      .slice(0, limit);
  }

  /**
   * Recupera tutti i moduli per selezione obiettivo
   * @returns {Promise<Array>}
   */
  async getAllModules() {
    try {
      const modules = await this.db.modules.toArray();
      return modules.map(module => ({
        id: module.code || module.id, // Use code (BIKE-X.Y.Z) if available, fallback to numeric ID
        title: module.title,
        teachingArea: module.teachingArea,
        level: module.level || 1
      }));
    } catch (error) {
      console.error('❌ Errore recupero moduli:', error);
      throw error;
    }
  }

  /**
   * Recupera percorso di apprendimento per raggiungere un modulo obiettivo
   * @param {string} moduleId
   * @returns {Promise<Object>}
   */
  async getGoalPath(moduleId) {
    try {
      const [modules, progressRecords] = await Promise.all([
        this.db.modules.toArray(),
        this.db.progress.toArray()
      ]);

      const progressMap = new Map(
        progressRecords.map(p => [p.moduleId, p.status])
      );

      // Create module maps for both numeric ID and code lookup
      const moduleMapById = new Map(modules.map(m => [m.id, m]));
      const moduleMapByCode = new Map(modules.map(m => [m.code, m]));
      
      // Try to find module by code first, then by numeric ID
      let targetModule = moduleMapByCode.get(moduleId);
      if (!targetModule) {
        targetModule = moduleMapById.get(moduleId);
      }

      if (!targetModule) {
        throw new Error(`Modulo ${moduleId} non trovato`);
      }

      // Trova tutte le dipendenze ricorsivamente usando il database (includendo il modulo obiettivo stesso)
      const allDependencies = await this.getAllDependenciesFromDatabase(moduleId);
      const uniqueDependencies = [...new Set([...allDependencies, moduleId])];

      // Crea percorso ordinato
      const path = this.buildOrderedPath(uniqueDependencies, moduleMapByCode, progressMap);

      // Calcola statistiche
      const completed = path.filter(step => step.status === 'completed').length;
      const pending = path.filter(step => step.status !== 'completed').length;
      const total = path.length;

      return {
        path,
        completed,
        pending,
        total,
        targetModule: {
          id: targetModule.code || targetModule.id,
          title: targetModule.title,
          teachingArea: targetModule.teachingArea,
          level: targetModule.level || 1
        }
      };
    } catch (error) {
      console.error('❌ Errore recupero percorso obiettivo:', error);
      throw error;
    }
  }

  /**
   * Trova tutte le dipendenze ricorsivamente
   * @param {string} moduleId
   * @param {Map} moduleMap
   * @returns {Array}
   */
  getAllDependencies(moduleId, moduleMap) {
    const dependencies = [];
    const visited = new Set();

    const findDependencies = (currentId) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const module = moduleMap.get(currentId);
      if (!module || !module.dependencies) return;

      module.dependencies.forEach(dep => {
        if (!visited.has(dep.moduleId)) {
          dependencies.push(dep.moduleId);
          findDependencies(dep.moduleId);
        }
      });
    };

    findDependencies(moduleId);
    return dependencies;
  }

  /**
   * Trova tutte le dipendenze ricorsivamente con supporto per ID multipli
   * @param {string} moduleId
   * @param {Map} moduleMapByCode
   * @param {Map} moduleMapById
   * @returns {Array}
   */
  getAllDependenciesWithFallback(moduleId, moduleMapByCode, moduleMapById) {
    const dependencies = [];
    const visited = new Set();

    const findDependencies = (currentId) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      // Try to find module by code first, then by numeric ID
      let module = moduleMapByCode.get(currentId);
      if (!module) {
        module = moduleMapById.get(currentId);
      }

      if (!module) return;

      // For now, use the original approach since we're in synchronous context
      // The real fix needs to be in the getGoalPath method to use async dependency resolution
      if (module.dependencies) {
        module.dependencies.forEach(dep => {
          if (!visited.has(dep.moduleId)) {
            dependencies.push(dep.moduleId);
            findDependencies(dep.moduleId);
          }
        });
      }
    };

    findDependencies(moduleId);
    return dependencies;
  }

  /**
   * Trova tutte le dipendenze ricorsivamente dal database
   * @param {string} moduleId
   * @param {Set} visited
   * @returns {Promise<Array>}
   */
  async getAllDependenciesFromDatabase(moduleId, visited = new Set()) {
    if (visited.has(moduleId)) {
      return [];
    }
    visited.add(moduleId);

    // Convert module code to numeric ID for dependency manager
    const modules = await this.db.modules.toArray();
    const moduleMapByCode = new Map(modules.map(m => [m.code, m]));
    const moduleMapById = new Map(modules.map(m => [m.id, m]));
    
    // Try to find module by code first, then by numeric ID
    let targetModule = moduleMapByCode.get(moduleId);
    if (!targetModule) {
      targetModule = moduleMapById.get(moduleId);
    }

    if (!targetModule) {
      console.warn(`Module ${moduleId} not found in database`);
      return [];
    }

    // Use dependency manager to get prerequisites from the database with numeric ID
    const prerequisites = await this.dependencyManager.getPrerequisites(targetModule.id);
    
    if (prerequisites.length > 0) {
      const allDependencies = [];
      
      // Recursively get dependencies of dependencies
      for (const dep of prerequisites) {
        // Check if prerequisite has a valid code (dependency manager returns module objects)
        if (!dep.code) {
          console.warn('⚠️ Prerequisite missing code:', dep);
          continue;
        }
        
        // Use the module code directly
        allDependencies.push(dep.code);
        
        const nestedDeps = await this.getAllDependenciesFromDatabase(dep.code, visited);
        allDependencies.push(...nestedDeps);
      }
      
      return [...new Set(allDependencies)]; // Remove duplicates
    }

    return [];
  }

  /**
   * Costruisce percorso ordinato per dipendenze
   * @param {Array} dependencyIds
   * @param {Map} moduleMap
   * @param {Map} progressMap
   * @returns {Array}
   */
  buildOrderedPath(dependencyIds, moduleMap, progressMap) {
    const path = [];
    const added = new Set();

    const addToPath = (moduleId) => {
      if (added.has(moduleId)) return;
      
      const module = moduleMap.get(moduleId);
      if (!module) return;

      // Aggiungi prima tutte le dipendenze
      if (module.dependencies) {
        module.dependencies.forEach(dep => {
          if (!added.has(dep.moduleId)) {
            addToPath(dep.moduleId);
          }
        });
      }

      // Poi aggiungi il modulo stesso
      const status = progressMap.get(moduleId) || 'not-started';
      path.push({
        moduleId: module.code || module.id,
        title: module.title,
        teachingArea: module.teachingArea,
        level: module.level || 1,
        status: status,
        dependencies: module.dependencies || []
      });
      added.add(moduleId);
    };

    // Aggiungi tutte le dipendenze in ordine corretto
    dependencyIds.forEach(moduleId => {
      addToPath(moduleId);
    });

    return path;
  }
}

// Export singleton instance
export default new DashboardManager();