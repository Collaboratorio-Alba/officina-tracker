/**
 * Dashboard View
 * Visualizzazione dashboard con heatmap aree didattiche e timeline progressi
 */

import DashboardManager from '../database/dashboard-manager.js';

class DashboardView {
  constructor() {
    this.container = document.getElementById('dashboard-view');
    this.dashboardManager = DashboardManager; // Use singleton instance
    this.currentView = 'heatmap'; // 'heatmap' | 'timeline' | 'stats' | 'goal'
    this.selectedGoalModule = null;
    
    // Load persisted goal selection
    this.loadPersistedGoal();
  }

  /**
   * Inizializza la vista dashboard
   */
  async init() {
    console.log('📊 Inizializzazione vista dashboard...');
    
    try {
      // Carica dati dashboard
      await this.loadDashboardData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Mostra vista iniziale
      await this.showHeatmapView();
      
      console.log('✅ Vista dashboard inizializzata');
      
    } catch (error) {
      console.error('❌ Errore inizializzazione dashboard:', error);
      this.showError('Errore caricamento dashboard');
    }
  }

  /**
   * Carica dati per dashboard
   */
  async loadDashboardData() {
    this.teachingAreaStats = await this.dashboardManager.getTeachingAreaStats();
    this.timelineData = await this.dashboardManager.getTimelineData();
    this.dashboardStats = await this.dashboardManager.getDashboardStats();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Event listeners per switch view interna
    const heatmapBtn = this.container?.querySelector('#dashboard-heatmap-btn');
    const timelineBtn = this.container?.querySelector('#dashboard-timeline-btn');
    const statsBtn = this.container?.querySelector('#dashboard-stats-btn');
    const goalBtn = this.container?.querySelector('#dashboard-goal-btn');

    if (heatmapBtn) {
      heatmapBtn.addEventListener('click', () => this.showHeatmapView());
    }
    if (timelineBtn) {
      timelineBtn.addEventListener('click', () => this.showTimelineView());
    }
    if (statsBtn) {
      statsBtn.addEventListener('click', () => this.showStatsView());
    }
    if (goalBtn) {
      goalBtn.addEventListener('click', () => this.showGoalView());
    }

    // Event listeners per aree didattiche (navigazione a tabella filtrata)
    this.setupTeachingAreaNavigation();
  }

  /**
   * Setup navigazione per aree didattiche
   */
  setupTeachingAreaNavigation() {
    // Questo verrà chiamato dopo il rendering delle aree
    setTimeout(() => {
      const areaCards = this.container?.querySelectorAll('.teaching-area-card');
      if (areaCards) {
        areaCards.forEach(card => {
          card.addEventListener('click', (e) => {
            if (!e.target.closest('.area-actions')) {
              const areaName = card.dataset.area;
              this.navigateToFilteredTable(areaName);
            }
          });
        });
      }
    }, 100);
  }

  /**
   * Naviga alla vista tabella filtrata per area didattica
   */
  navigateToFilteredTable(areaName) {
    console.log(`🎯 Navigazione a tabella filtrata per area: ${areaName}`);
    
    // Salva filtro per area
    sessionStorage.setItem('filterTeachingArea', areaName);
    
    // Cambia a vista tabella
    const tableBtn = document.getElementById('table-view-btn');
    if (tableBtn) {
      tableBtn.click();
    }
  }

  /**
   * Mostra vista heatmap aree didattiche
   */
  async showHeatmapView() {
    this.currentView = 'heatmap';
    this.updateViewButtons();
    
    const html = `
      <div class="dashboard-header">
        <h2>📊 Dashboard Progressi</h2>
        <div class="dashboard-actions">
          <button id="dashboard-heatmap-btn" class="active">Heatmap</button>
          <button id="dashboard-timeline-btn">Timeline</button>
          <button id="dashboard-stats-btn">Statistiche</button>
          <button id="dashboard-goal-btn">Obiettivo</button>
        </div>
      </div>

      <div class="heatmap-container">
        <h3>🔄 Progresso per Aree Didattiche</h3>
        <div class="heatmap-grid">
          ${this.renderTeachingAreaCards()}
        </div>
      </div>

      <div class="dashboard-insights">
        <h4>💡 Insights</h4>
        <div class="insights-grid">
          ${this.renderInsights()}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.setupEventListeners();
  }

  /**
   * Mostra vista timeline progressi
   */
  async showTimelineView() {
    this.currentView = 'timeline';
    this.updateViewButtons();
    
    // Calculate first and last completion dates from timeline data
    const firstCompletion = this.timelineData.timeline.length > 0 ? this.timelineData.timeline[0].date : null;
    const lastCompletion = this.timelineData.timeline.length > 0 ? this.timelineData.timeline[this.timelineData.timeline.length - 1].date : null;
    
    const html = `
      <div class="dashboard-header">
        <h2>📈 Timeline Progressi</h2>
        <div class="dashboard-actions">
          <button id="dashboard-heatmap-btn">Heatmap</button>
          <button id="dashboard-timeline-btn" class="active">Timeline</button>
          <button id="dashboard-stats-btn">Statistiche</button>
          <button id="dashboard-goal-btn">Obiettivo</button>
        </div>
      </div>

      <div class="timeline-container">
        <h3>📅 Evoluzione Progressi nel Tempo</h3>
        <div class="timeline-chart">
          ${this.renderTimelineChart()}
        </div>
        
        <div class="timeline-stats">
          <div class="stat-card">
            <h4>Primo completamento</h4>
            <p class="stat-value">${this.formatDate(firstCompletion)}</p>
          </div>
          <div class="stat-card">
            <h4>Ultimo completamento</h4>
            <p class="stat-value">${this.formatDate(lastCompletion)}</p>
          </div>
          <div class="stat-card">
            <h4>Completamenti totali</h4>
            <p class="stat-value">${this.timelineData.totalCompleted}</p>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.setupEventListeners();
  }

  /**
   * Mostra vista statistiche dettagliate
   */
  async showStatsView() {
    this.currentView = 'stats';
    this.updateViewButtons();
    
    const html = `
      <div class="dashboard-header">
        <h2>📋 Statistiche Dettagliate</h2>
        <div class="dashboard-actions">
          <button id="dashboard-heatmap-btn">Heatmap</button>
          <button id="dashboard-timeline-btn">Timeline</button>
          <button id="dashboard-stats-btn" class="active">Statistiche</button>
          <button id="dashboard-goal-btn">Obiettivo</button>
        </div>
      </div>

      <div class="stats-container">
        <div class="stats-overview">
          <h3>📊 Panoramica Generale</h3>
          <div class="stats-grid">
            <div class="stat-card large">
              <h4>Moduli Totali</h4>
              <p class="stat-value">${this.dashboardStats.totalModules}</p>
            </div>
            <div class="stat-card large">
              <h4>Completati</h4>
              <p class="stat-value">${this.dashboardStats.completed}</p>
              <p class="stat-percentage">${this.dashboardStats.completionPercentage}%</p>
            </div>
            <div class="stat-card large">
              <h4>In Corso</h4>
              <p class="stat-value">${this.dashboardStats.inProgress}</p>
            </div>
            <div class="stat-card large">
              <h4>Da Iniziare</h4>
              <p class="stat-value">${this.dashboardStats.notStarted}</p>
            </div>
          </div>
        </div>

        <div class="stats-details">
          <div class="stats-column">
            <h4>🎯 Raccomandazioni</h4>
            <div class="recommendations">
              ${this.renderRecommendations()}
            </div>
          </div>
          
          <div class="stats-column">
            <h4>📈 Andamento</h4>
            <div class="trends">
              ${this.renderTrends()}
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.setupEventListeners();
  }

  /**
   * Renderizza cards aree didattiche per heatmap
   */
  renderTeachingAreaCards() {
    if (!this.teachingAreaStats) return '';

    return Object.entries(this.teachingAreaStats)
      .map(([areaName, stats]) => {
        const percentage = Math.round(stats.completionPercentage);
        const intensity = Math.floor(percentage / 20); // 0-5 scale
        const colorClass = `intensity-${intensity}`;
        
        return `
          <div class="teaching-area-card ${colorClass}" data-area="${areaName}">
            <div class="area-header">
              <h4>${areaName}</h4>
              <div class="area-actions">
                <button class="btn-small" onclick="event.stopPropagation(); dashboardView.navigateToFilteredTable('${areaName}')">
                  📋
                </button>
              </div>
            </div>
            <div class="area-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
              </div>
              <span class="progress-text">${stats.completed}/${stats.totalModules} (${percentage}%)</span>
            </div>
            <div class="area-details">
              <div class="detail-item">
                <span>🎯 Completati</span>
                <span>${stats.completed}</span>
              </div>
              <div class="detail-item">
                <span>⏳ In corso</span>
                <span>${stats.inProgress}</span>
              </div>
              <div class="detail-item">
                <span>📚 Totali</span>
                <span>${stats.totalModules}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Renderizza chart timeline
   */
  renderTimelineChart() {
    if (!this.timelineData || !this.timelineData.timeline || this.timelineData.timeline.length === 0) {
      return '<p class="no-data">Nessun dato timeline disponibile</p>';
    }

    // Use the actual timeline data from dashboard manager
    const timelineEntries = this.timelineData.timeline;
    
    if (timelineEntries.length === 0) {
      return '<p class="no-data">Nessun progresso registrato nel tempo</p>';
    }

    // Simple bar chart using CSS - show cumulative progress over time
    const maxProgress = Math.max(...timelineEntries.map(entry => entry.cumulativeCount));
    
    return `
      <div class="timeline-bars">
        ${timelineEntries.map((entry, index) => {
          const height = maxProgress > 0 ? (entry.cumulativeCount / maxProgress * 100) : 0;
          return `
            <div class="timeline-bar">
              <div class="bar-fill" style="height: ${height}%"></div>
              <div class="bar-label">${this.formatDate(entry.date)}</div>
              <div class="bar-value">${entry.cumulativeCount}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Renderizza insights
   */
  renderInsights() {
    if (!this.dashboardStats) return '';

    const insights = [];
    
    // Insight 1: Area con maggior progresso
    const bestArea = Object.entries(this.teachingAreaStats)
      .reduce((best, [area, stats]) => 
        stats.completionPercentage > best.completionPercentage ? 
        { area, ...stats } : best, 
        { area: '', completionPercentage: 0 }
      );
    
    if (bestArea.area) {
      insights.push(`
        <div class="insight-card positive">
          <h5>🏆 Area più avanzata</h5>
          <p>${bestArea.area} (${Math.round(bestArea.completionPercentage)}% completato)</p>
        </div>
      `);
    }

    // Insight 2: Area che necessita attenzione
    const needsAttention = Object.entries(this.teachingAreaStats)
      .filter(([_, stats]) => stats.completionPercentage < 50)
      .sort((a, b) => a[1].completionPercentage - b[1].completionPercentage)[0];
    
    if (needsAttention) {
      insights.push(`
        <div class="insight-card warning">
          <h5>⚠️ Da migliorare</h5>
          <p>${needsAttention[0]} (${Math.round(needsAttention[1].completionPercentage)}% completato)</p>
        </div>
      `);
    }

    // Insight 3: Progresso generale
    insights.push(`
      <div class="insight-card info">
        <h5>📈 Progresso totale</h5>
        <p>${this.dashboardStats.completionPercentage}% dei moduli completati</p>
      </div>
    `);

    return insights.join('');
  }

  /**
   * Renderizza raccomandazioni
   */
  renderRecommendations() {
    const recommendations = [];
    
    if (this.dashboardStats.completionPercentage < 25) {
      recommendations.push('<p>🎯 Concentrati sulle aree di base per costruire solide fondamenta</p>');
    } else if (this.dashboardStats.completionPercentage < 50) {
      recommendations.push('<p>🚀 Continua a esplorare nuove aree per ampliare le tue competenze</p>');
    } else if (this.dashboardStats.completionPercentage < 75) {
      recommendations.push('<p>💪 Approfondisci le aree specialistiche per diventare esperto</p>');
    } else {
      recommendations.push('<p>🌟 Complimenti! Stai completando il percorso formativo</p>');
    }

    // Raccomandazione basata su area che necessita attenzione
    const lowArea = Object.entries(this.teachingAreaStats)
      .filter(([_, stats]) => stats.completionPercentage < 30)[0];
    
    if (lowArea) {
      recommendations.push(`<p>📚 Considera di dedicare tempo a <strong>${lowArea[0]}</strong> (${Math.round(lowArea[1].completionPercentage)}% completato)</p>`);
    }

    return recommendations.join('');
  }

  /**
   * Renderizza trend
   */
  renderTrends() {
    const trends = [];
    
    if (this.timelineData && this.timelineData.monthlyProgress) {
      const monthlyData = Object.values(this.timelineData.monthlyProgress);
      if (monthlyData.length >= 2) {
        const recentProgress = monthlyData.slice(-3); // Ultimi 3 mesi
        const avgRecent = recentProgress.reduce((a, b) => a + b, 0) / recentProgress.length;
        
        if (avgRecent > 5) {
          trends.push('<p>📈 Trend positivo: stai mantenendo un buon ritmo di apprendimento</p>');
        } else if (avgRecent > 0) {
          trends.push('<p>⚖️ Progresso costante: continua così!</p>');
        } else {
          trends.push('<p>⏸️ Pausa nell\'apprendimento: considera di riprendere lo studio</p>');
        }
      }
    }

    trends.push(`<p>🎯 Obiettivo: ${this.dashboardStats.notStarted} moduli rimanenti</p>`);
    
    return trends.join('');
  }

  /**
   * Aggiorna stato bottoni view interna
   */
  updateViewButtons() {
    const buttons = this.container?.querySelectorAll('.dashboard-actions button');
    if (buttons) {
      buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === `dashboard-${this.currentView}-btn`) {
          btn.classList.add('active');
        }
      });
    }
  }

  /**
   * Formatta data per visualizzazione
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  }

  /**
   * Formatta mese per visualizzazione
   */
  formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
  }

  /**
   * Mostra errore
   */
  showError(message) {
    this.container.innerHTML = `
      <div class="error-message">
        <h3>❌ Errore</h3>
        <p>${message}</p>
        <button onclick="dashboardView.init()">Riprova</button>
      </div>
    `;
  }

  /**
   * Mostra/nascondi vista
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Mostra vista obiettivo
   */
  async showGoalView() {
    this.currentView = 'goal';
    this.updateViewButtons();
    
    const html = `
      <div class="dashboard-header">
        <h2>🎯 Obiettivo</h2>
        <div class="dashboard-actions">
          <button id="dashboard-heatmap-btn">Heatmap</button>
          <button id="dashboard-timeline-btn">Timeline</button>
          <button id="dashboard-stats-btn">Statistiche</button>
          <button id="dashboard-goal-btn" class="active">Obiettivo</button>
        </div>
      </div>

      <div class="goal-container">
        <h3>📋 Percorso di Apprendimento</h3>
        <p>Seleziona un modulo obiettivo per vedere il percorso di apprendimento necessario</p>
        
        <div class="goal-selection">
          <label for="goal-module-select">Seleziona modulo obiettivo:</label>
          <select id="goal-module-select" class="goal-select">
            <option value="">-- Seleziona un modulo --</option>
          </select>
        </div>

        <div id="goal-path-content" class="goal-path-content">
          <div class="no-goal-selected">
            <p>Seleziona un modulo obiettivo per visualizzare il percorso di apprendimento</p>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.setupEventListeners();
    await this.loadGoalModules();
  }

  /**
   * Carica moduli per selezione obiettivo
   */
  async loadGoalModules() {
    const select = document.getElementById('goal-module-select');
    if (!select) {
      console.error('❌ Elemento select goal-module-select non trovato');
      return;
    }

    try {
      console.log('📋 Caricamento moduli per selezione obiettivo...');
      const allModules = await this.dashboardManager.getAllModules();
      console.log(`✅ Trovati ${allModules.length} moduli`);
      
      // Debug: mostra struttura dei primi 3 moduli
      if (allModules.length > 0) {
        console.log('🔍 Struttura primo modulo:', JSON.stringify(allModules[0], null, 2));
      }
      
      if (allModules.length === 0) {
        console.warn('⚠️ Nessun modulo trovato nel database');
        select.innerHTML = '<option value="">-- Nessun modulo disponibile --</option>';
        return;
      }

      // Ordina i moduli per livello e ID
      const sortedModules = allModules.sort((a, b) => {
        // Estrai livello dal formato "BIKE-X.Y.Z" con gestione errori
        const getLevel = (module) => {
          const id = module.id || '';
          if (typeof id !== 'string') return 0;
          const match = id.match(/BIKE-(\d+)\./);
          return match ? parseInt(match[1]) : 0;
        };
        
        const levelA = getLevel(a);
        const levelB = getLevel(b);
        if (levelA !== levelB) return levelA - levelB;
        
        // Ordina per ID come fallback con gestione sicura
        const idA = String(a.id || '');
        const idB = String(b.id || '');
        return idA.localeCompare(idB);
      });

      console.log(`📊 Moduli ordinati: ${sortedModules.length}`);
      
      select.innerHTML = '<option value="">-- Seleziona un modulo --</option>' +
        sortedModules.map(module =>
          `<option value="${module.id}">${module.id} - ${module.title}</option>`
        ).join('');

      console.log('✅ Dropdown moduli popolato con successo');

      // Aggiungi event listener per selezione
      select.addEventListener('change', (e) => {
        this.selectedGoalModule = e.target.value;
        if (this.selectedGoalModule) {
          console.log(`🎯 Modulo obiettivo selezionato: ${this.selectedGoalModule}`);
          this.savePersistedGoal(this.selectedGoalModule);
          this.loadGoalPath(this.selectedGoalModule);
        } else {
          this.clearPersistedGoal();
          this.showNoGoalSelected();
        }
      });

      // Se c'è un obiettivo persistente, selezionalo automaticamente
      if (this.selectedGoalModule) {
        select.value = this.selectedGoalModule;
        console.log(`🎯 Obiettivo persistente caricato: ${this.selectedGoalModule}`);
        this.loadGoalPath(this.selectedGoalModule);
      }

    } catch (error) {
      console.error('❌ Errore caricamento moduli obiettivo:', error);
      select.innerHTML = '<option value="">-- Errore caricamento moduli --</option>';
    }
  }

  /**
   * Carica percorso obiettivo
   */
  async loadGoalPath(moduleId) {
    const pathContent = document.getElementById('goal-path-content');
    if (!pathContent) return;

    pathContent.innerHTML = '<div class="loading">Caricamento percorso...</div>';

    try {
      const goalPath = await this.dashboardManager.getGoalPath(moduleId);
      this.renderGoalPath(goalPath, pathContent);
    } catch (error) {
      console.error('Error loading goal path:', error);
      pathContent.innerHTML = '<div class="error">Errore nel caricamento del percorso</div>';
    }
  }

  /**
   * Renderizza percorso obiettivo
   */
  renderGoalPath(goalPath, container) {
    if (!goalPath || !goalPath.path) {
      container.innerHTML = '<div class="no-path">Nessun percorso trovato per questo modulo</div>';
      return;
    }

    const { path, completed, pending, total } = goalPath;
    
    container.innerHTML = `
      <div class="goal-summary">
        <div class="summary-card completed">
          <h4>✅ Completati</h4>
          <span class="count">${completed}</span>
        </div>
        <div class="summary-card pending">
          <h4>📚 Da studiare</h4>
          <span class="count">${pending}</span>
        </div>
        <div class="summary-card total">
          <h4>📊 Totale</h4>
          <span class="count">${total}</span>
        </div>
      </div>

      <div class="path-visualization">
        <h4>🛣️ Percorso di apprendimento:</h4>
        <div class="path-steps">
          ${path.map((step, index) => `
            <div class="path-step ${step.status}">
              <div class="step-header">
                <span class="step-number">${index + 1}</span>
                <span class="step-status ${step.status}">
                  ${step.status === 'completed' ? '✅' : step.status === 'in-progress' ? '🔄' : '⏳'}
                </span>
                <span class="step-id">${step.moduleId}</span>
              </div>
              <div class="step-title">${step.title}</div>
              <div class="step-info">
                <span class="step-level">Livello ${step.level}</span>
                <span class="step-area">${step.teachingArea}</span>
              </div>
              ${step.dependencies && step.dependencies.length > 0 ? `
                <div class="step-dependencies">
                  <small>Dipendenze: ${step.dependencies.map(dep => dep.moduleId).join(', ')}</small>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Mostra nessun obiettivo selezionato
   */
  showNoGoalSelected() {
    const pathContent = document.getElementById('goal-path-content');
    if (pathContent) {
      pathContent.innerHTML = `
        <div class="no-goal-selected">
          <p>Seleziona un modulo obiettivo per visualizzare il percorso di apprendimento</p>
        </div>
      `;
    }
  }

  /**
   * Salva obiettivo selezionato per persistenza
   * @param {string} moduleId
   */
  savePersistedGoal(moduleId) {
    try {
      localStorage.setItem('dashboardGoalModule', moduleId);
      console.log(`💾 Obiettivo salvato: ${moduleId}`);
    } catch (error) {
      console.warn('⚠️ Impossibile salvare obiettivo in localStorage:', error);
    }
  }

  /**
   * Carica obiettivo persistente
   */
  loadPersistedGoal() {
    try {
      const savedGoal = localStorage.getItem('dashboardGoalModule');
      if (savedGoal) {
        this.selectedGoalModule = savedGoal;
        console.log(`📂 Obiettivo caricato da persistenza: ${savedGoal}`);
      }
    } catch (error) {
      console.warn('⚠️ Impossibile caricare obiettivo da localStorage:', error);
    }
  }

  /**
   * Rimuovi obiettivo persistente
   */
  clearPersistedGoal() {
    try {
      localStorage.removeItem('dashboardGoalModule');
      console.log('🗑️ Obiettivo persistente rimosso');
    } catch (error) {
      console.warn('⚠️ Impossibile rimuovere obiettivo da localStorage:', error);
    }
  }
}

// Crea istanza globale
const dashboardView = new DashboardView();
window.dashboardView = dashboardView;

export default DashboardView;
