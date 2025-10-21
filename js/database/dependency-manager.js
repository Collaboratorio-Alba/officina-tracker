/**
 * Dependency Manager
 * Gestione delle dipendenze tra moduli (prerequisiti)
 */

import db from './db-config.js';

class DependencyManager {
  constructor() {
    this.db = db;
  }
  
  /**
   * Aggiunge una dipendenza tra moduli
   * @param {number} moduleId - ID del modulo dipendente
   * @param {number} prerequisiteId - ID del modulo prerequisito
   * @param {string} type - Tipo dipendenza ('mandatory' | 'recommended')
   * @returns {Promise<number>} ID della dipendenza creata
   */
  async addDependency(moduleId, prerequisiteId, type = 'mandatory') {
    try {
      // Validazioni
      if (moduleId === prerequisiteId) {
        throw new Error('Un modulo non può dipendere da se stesso');
      }
      
      // Verifica che i moduli esistano
      const [module, prerequisite] = await Promise.all([
        this.db.modules.get(moduleId),
        this.db.modules.get(prerequisiteId)
      ]);
      
      if (!module) {
        throw new Error(`Modulo ${moduleId} non trovato`);
      }
      if (!prerequisite) {
        throw new Error(`Prerequisito ${prerequisiteId} non trovato`);
      }
      
      // Verifica che non crei cicli
      if (await this.wouldCreateCycle(moduleId, prerequisiteId)) {
        throw new Error('Impossibile aggiungere: creerebbe un ciclo nelle dipendenze');
      }
      
      // Verifica se la dipendenza esiste già
      const existing = await this.db.dependencies
        .where('[moduleId+prerequisiteId]')
        .equals([moduleId, prerequisiteId])
        .first();
      
      if (existing) {
        console.warn('⚠️ Dipendenza già esistente');
        return existing.id;
      }
      
      // Aggiungi dipendenza
      const id = await this.db.dependencies.add({
        moduleId,
        prerequisiteId,
        dependencyType: type,
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Dipendenza creata: ${prerequisite.title} → ${module.title}`);
      
      return id;
    } catch (error) {
      console.error('❌ Errore creazione dipendenza:', error);
      throw error;
    }
  }
  
  /**
   * Rimuove una dipendenza
   * @param {number} id - ID della dipendenza
   * @returns {Promise<void>}
   */
  async removeDependency(id) {
    try {
      await this.db.dependencies.delete(id);
      console.log(`✅ Dipendenza rimossa: ID ${id}`);
    } catch (error) {
      console.error('❌ Errore rimozione dipendenza:', error);
      throw error;
    }
  }
  
  /**
   * Recupera tutti i prerequisiti di un modulo
   * @param {number} moduleId - ID del modulo
   * @returns {Promise<Array>} Array di moduli prerequisito
   */
  async getPrerequisites(moduleId) {
    try {
      const deps = await this.db.dependencies
        .where('moduleId').equals(moduleId)
        .toArray();
      
      const prerequisites = await Promise.all(
        deps.map(async d => {
          const module = await this.db.modules.get(d.prerequisiteId);
          return {
            ...module,
            dependencyType: d.dependencyType,
            dependencyId: d.id
          };
        })
      );
      
      return prerequisites.filter(p => p.id !== undefined);
    } catch (error) {
      console.error('❌ Errore recupero prerequisiti:', error);
      throw error;
    }
  }
  
  /**
   * Recupera tutti i moduli che dipendono da un dato modulo
   * @param {number} moduleId - ID del modulo prerequisito
   * @returns {Promise<Array>} Array di moduli dipendenti
   */
  async getDependents(moduleId) {
    try {
      const deps = await this.db.dependencies
        .where('prerequisiteId').equals(moduleId)
        .toArray();
      
      const dependents = await Promise.all(
        deps.map(async d => {
          const module = await this.db.modules.get(d.moduleId);
          return {
            ...module,
            dependencyType: d.dependencyType,
            dependencyId: d.id
          };
        })
      );
      
      return dependents.filter(d => d.id !== undefined);
    } catch (error) {
      console.error('❌ Errore recupero dipendenti:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se aggiungere una dipendenza creerebbe un ciclo
   * Usa algoritmo DFS (Depth-First Search)
   * @param {number} fromId - ID modulo sorgente
   * @param {number} toId - ID modulo destinazione
   * @returns {Promise<boolean>}
   */
  async wouldCreateCycle(fromId, toId) {
    try {
      const visited = new Set();
      
      const hasCycle = async (nodeId) => {
        // Se raggiungiamo il nodo di partenza, c'è un ciclo
        if (nodeId === fromId) {
          return true;
        }
        
        // Se già visitato, non c'è ciclo in questo percorso
        if (visited.has(nodeId)) {
          return false;
        }
        
        visited.add(nodeId);
        
        // Recupera tutte le dipendenze del nodo corrente
        const deps = await this.db.dependencies
          .where('moduleId').equals(nodeId)
          .toArray();
        
        // Controlla ricorsivamente tutti i prerequisiti
        for (const dep of deps) {
          if (await hasCycle(dep.prerequisiteId)) {
            return true;
          }
        }
        
        return false;
      };
      
      return await hasCycle(toId);
    } catch (error) {
      console.error('❌ Errore verifica cicli:', error);
      throw error;
    }
  }
  
  /**
   * Genera ordinamento topologico dei moduli
   * Usa algoritmo di Kahn
   * @returns {Promise<Array>} Array di moduli in ordine topologico
   */
  async getTopologicalOrder() {
    try {
      const modules = await this.db.modules.toArray();
      const dependencies = await this.db.dependencies.toArray();
      
      // Costruisci grafo di adiacenza e calcola in-degree
      const graph = new Map();
      const inDegree = new Map();
      
      modules.forEach(m => {
        graph.set(m.id, []);
        inDegree.set(m.id, 0);
      });
      
      dependencies.forEach(d => {
        graph.get(d.prerequisiteId).push(d.moduleId);
        inDegree.set(d.moduleId, inDegree.get(d.moduleId) + 1);
      });
      
      // Algoritmo di Kahn
      const queue = [];
      const result = [];
      
      // Inizializza coda con nodi senza prerequisiti
      inDegree.forEach((degree, moduleId) => {
        if (degree === 0) {
          queue.push(moduleId);
        }
      });
      
      // Processa nodi in ordine topologico
      while (queue.length > 0) {
        const current = queue.shift();
        result.push(current);
        
        // Riduci in-degree dei vicini
        const neighbors = graph.get(current) || [];
        neighbors.forEach(neighbor => {
          inDegree.set(neighbor, inDegree.get(neighbor) - 1);
          if (inDegree.get(neighbor) === 0) {
            queue.push(neighbor);
          }
        });
      }
      
      // Se result.length < modules.length, c'è un ciclo
      if (result.length < modules.length) {
        console.warn('⚠️ Rilevato ciclo nelle dipendenze!');
      }
      
      // Mappa IDs ai moduli completi
      return result.map(id => modules.find(m => m.id === id));
    } catch (error) {
      console.error('❌ Errore ordinamento topologico:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se un modulo può essere iniziato
   * (tutti i prerequisiti obbligatori sono completati)
   * @param {number} moduleId - ID del modulo
   * @returns {Promise<Object>} { canStart: boolean, missingPrereqs: Array }
   */
  async canStartModule(moduleId) {
    try {
      const prerequisites = await this.getPrerequisites(moduleId);
      const mandatoryPrereqs = prerequisites.filter(
        p => p.dependencyType === 'mandatory'
      );
      
      const missingPrereqs = [];
      
      for (const prereq of mandatoryPrereqs) {
        const progress = await this.db.progress
          .where('moduleId').equals(prereq.id)
          .first();
        
        if (!progress || progress.status !== 'completed') {
          missingPrereqs.push(prereq);
        }
      }
      
      return {
        canStart: missingPrereqs.length === 0,
        missingPrereqs,
        totalPrereqs: mandatoryPrereqs.length
      };
    } catch (error) {
      console.error('❌ Errore verifica prerequisiti:', error);
      throw error;
    }
  }
  
  /**
   * Recupera tutte le dipendenze
   * @returns {Promise<Array>}
   */
  async getAllDependencies() {
    try {
      return await this.db.dependencies.toArray();
    } catch (error) {
      console.error('❌ Errore recupero dipendenze:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new DependencyManager();

