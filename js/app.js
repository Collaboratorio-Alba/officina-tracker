/**
 * App Entry Point
 * Inizializzazione applicazione Tracker Formazione Ciclofficina (Schema Esteso 1.1.0)
 */

import db from './database/db-config.js';
import ModuleManager from './database/module-manager.js';
import DependencyManager from './database/dependency-manager.js';
import ProgressManager from './database/progress-manager.js';
import AssessmentManager from './database/assessment-manager.js';
import MigrationManager from './database/migration-manager.js';
import LevelDataLoader from './data/level-data-loader.js';
import LevelMigrationManager from './database/level-migration-manager.js';
import DashboardView from './views/dashboard-view.js';
import AddNewModules from './utils/add-new-modules.js';
import BackupManager from './utils/backup-manager.js';

// Global variables
let selectedModuleId = null;
let renderingInProgress = false;
let graphRenderingInProgress = false;

// DOM elements
const tableBody = document.querySelector('#modules-table tbody');
const moduleDetailsSidebar = document.getElementById('module-details-sidebar');

// Inizializzazione applicazione
async function initApp() {
  console.log('🚲 Inizializzazione Tracker Formazione Ciclofficina...');
  
  try {
    // Attendi che il database sia pronto
    await db.open();
    console.log('✅ Database pronto');
    
    // Carica dati di esempio se il database è vuoto
    const moduleCount = await db.modules.count();
    
    if (moduleCount === 0) {
      console.log('📦 Caricamento dati di esempio...');
      await loadSampleData();
    } else {
      // Automatically add any missing modules from JSON files
      console.log('🔍 Controllo moduli mancanti...');
      const addResult = await AddNewModules.addMissingModules();
      if (addResult.success && addResult.added > 0) {
        console.log(`✅ Aggiunti ${addResult.added} nuovi moduli e ${addResult.dependencies || 0} dipendenze`);
        console.log('🔄 Ricarico applicazione per mostrare i nuovi moduli...');
        location.reload();
        return; // Stop execution since page will reload
      } else {
        console.log('ℹ️ Tutti i moduli sono aggiornati');
      }
    }
    
    // Mostra statistiche iniziali
    await displayStats();
    
    // Popola filtri
    await populateFilters();

    // Setup event listeners
    setupEventListeners();
    
    // Inizializza vista dashboard
    await initDashboardView();

    // Inizializzazione
    await renderModules();
    
    console.log('✅ Applicazione inizializzata con successo!');
    
  } catch (error) {
    console.error('❌ Errore inizializzazione:', error);
    showError('Errore durante l\'inizializzazione dell\'applicazione');
  }
}

/**
 * Popola opzioni filtro per insegnamento
 */
async function populateFilters() {
  const selectTeaching = document.getElementById('filter-teaching');
  selectTeaching.innerHTML = '<option value="all">Tutti</option>';
  const modules = await db.modules.toArray();
  const areas = [...new Set(modules.map(m => m.teachingArea).filter(a => a))];
  areas.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a; opt.textContent = a;
    selectTeaching.appendChild(opt);
  });
}

/**
 * Carica dati di esempio (Struttura Modulare a Livelli)
 */
async function loadSampleData() {
  try {
    // Verifica se serve migrazione a struttura modulare
    const needsLevelMigration = await LevelMigrationManager.needsLevelMigration();
    
    if (needsLevelMigration) {
      console.log('🔄 Database esistente rilevato, eseguo migrazione a struttura modulare...');
      await LevelMigrationManager.migrateToLevelStructure();
      return;
    }

    // Carica struttura modulare a livelli
    await LevelDataLoader.loadAllLevels();
    
    if (!LevelDataLoader.isLoaded()) {
      throw new Error('Impossibile caricare struttura modulare');
    }

    // Importa moduli dalla struttura modulare
    const modules = LevelDataLoader.getAllModules();
    await ModuleManager.bulkImportModules(modules);
    console.log(`✅ Importati ${modules.length} moduli (struttura modulare)`);
    
    // Crea dipendenze dai dati modulari
    const dbModules = await db.modules.toArray();
    const moduleMap = new Map(dbModules.map(m => [m.code, m.id]));
    
    let dependencyCount = 0;
    for (const module of modules) {
      if (module.prerequisites && module.prerequisites.length > 0) {
        for (const prereqCode of module.prerequisites) {
          const moduleId = moduleMap.get(module.code);
          const prerequisiteId = moduleMap.get(prereqCode);
          
          if (moduleId && prerequisiteId) {
            await DependencyManager.addDependency(moduleId, prerequisiteId, 'mandatory');
            dependencyCount++;
          } else {
            console.warn(`⚠️ Dipendenza non creata: ${module.code} -> ${prereqCode}`);
          }
        }
      }
    }
    
    console.log(`✅ Create ${dependencyCount} dipendenze`);
    
    // Mostra statistiche struttura modulare
    const stats = LevelDataLoader.getStats();
    console.log('\n📊 STRUTTURA MODULARE CARICATA');
    console.log('==============================');
    console.log(`Livelli: ${stats.levels}`);
    console.log(`Corsi: ${stats.courses}`);
    console.log(`Moduli totali: ${stats.modules}`);
    console.log(`Aree didattiche: ${stats.teachingAreas.join(', ')}`);
    console.log('==============================\n');
    
  } catch (error) {
    console.error('❌ Errore caricamento dati di esempio:', error);
    throw error;
  }
}

/**
 * Mostra statistiche nel console
 */
async function displayStats() {
  try {
    const stats = await ProgressManager.getStats();
    
    console.log('\n📊 STATISTICHE CORRENTI');
    console.log('========================');
    console.log(`Moduli totali: ${stats.total}`);
    console.log(`Completati: ${stats.completed} (${stats.completionRate}%)`);
    console.log(`In corso: ${stats.inProgress}`);
    console.log(`Da iniziare: ${stats.notStarted}`);
    console.log(`Score medio: ${stats.averageScore}/100`);
    console.log('\n📚 Per categoria:');
    
    Object.entries(stats.byCategory).forEach(([category, data]) => {
      console.log(`  ${category}: ${data.completed}/${data.total} completati`);
    });
    
    console.log('========================\n');
    
  } catch (error) {
    console.error('❌ Errore visualizzazione statistiche:', error);
  }
}

/**
 * Mostra dettagli del modulo nella sidebar
 */
async function showModuleDetails(moduleId) {
  const module = await db.modules.get(moduleId);
  if (!module) return;

  // Aggiorna i contenuti della sidebar
  document.getElementById('module-details-title').textContent = module.title;
  document.getElementById('module-details-code').textContent = module.code;
  document.getElementById('module-details-description').textContent = module.description || 'Nessuna descrizione disponibile';
  document.getElementById('module-details-duration').textContent = module.estimatedDuration || '-';
  
  // Aggiorna difficoltà con badge colorato
  const difficultyElement = document.getElementById('module-details-difficulty');
  difficultyElement.textContent = module.difficulty || '-';
  difficultyElement.className = 'module-details-badge ' +
    (module.difficulty === 'base' ? 'success' :
     module.difficulty === 'intermedio' ? 'warning' :
     module.difficulty === 'avanzato' ? 'primary' : 'info');
  
  // Aggiorna tipo
  const typeElement = document.getElementById('module-details-type');
  typeElement.textContent = module.type || '-';
  typeElement.className = 'module-details-badge ' +
    (module.type === 'presenza' ? 'primary' : 'info');
  
  document.getElementById('module-details-teaching-area').textContent = module.teachingArea || '-';

  // Aggiorna strumenti richiesti
  const toolsList = document.getElementById('module-details-tools');
  toolsList.innerHTML = '';
  if (module.toolsRequired && module.toolsRequired.length > 0) {
    module.toolsRequired.forEach(tool => {
      const li = document.createElement('li');
      li.textContent = tool;
      toolsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'Nessuno strumento specifico richiesto';
    li.style.color = 'var(--text-secondary)';
    toolsList.appendChild(li);
  }

  // Aggiorna obiettivi di apprendimento
  const outcomesList = document.getElementById('module-details-outcomes');
  outcomesList.innerHTML = '';
  if (module.learningOutcomes && module.learningOutcomes.length > 0) {
    module.learningOutcomes.forEach(outcome => {
      const li = document.createElement('li');
      li.textContent = outcome;
      outcomesList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'Nessun obiettivo specificato';
    li.style.color = 'var(--text-secondary)';
    outcomesList.appendChild(li);
  }

  // Aggiorna criteri di valutazione
  const criteriaElement = document.getElementById('module-details-criteria');
  if (module.practicalCriteria) {
    criteriaElement.innerHTML = `
      <p><strong>${module.practicalCriteria.description}</strong></p>
      <p><strong>Competenze richieste:</strong> ${module.practicalCriteria.requiredSkills?.join(', ') || 'Nessuna specificata'}</p>
      <p><strong>Metodo di valutazione:</strong> ${module.practicalCriteria.assessmentMethod || 'Non specificato'}</p>
      <p><strong>Metriche di qualità:</strong></p>
      <ul>
        ${module.practicalCriteria.qualityMetrics?.map(metric => `<li>${metric}</li>`).join('') || '<li>Nessuna metrica specificata</li>'}
      </ul>
    `;
  } else {
    criteriaElement.innerHTML = '<p>Nessun criterio di valutazione specificato</p>';
  }

  // Aggiorna prerequisiti
  const prerequisitesElement = document.getElementById('module-details-prerequisites');
  const dependencies = await db.dependencies.where('moduleId').equals(moduleId).toArray();
  
  if (dependencies.length > 0) {
    const prerequisiteModules = await Promise.all(
      dependencies.map(async dep => {
        const prereqModule = await db.modules.get(dep.prerequisiteId);
        return {
          module: prereqModule,
          type: dep.dependencyType
        };
      })
    );
    
    prerequisitesElement.innerHTML = `
      <p><strong>Questo modulo richiede:</strong></p>
      <ul class="module-details-list">
        ${prerequisiteModules.map(prereq => `
          <li>
            <strong>${prereq.module?.title || 'Modulo sconosciuto'}</strong>
            <span class="module-details-badge ${prereq.type === 'mandatory' ? 'primary' : 'info'}">
              ${prereq.type === 'mandatory' ? 'Obbligatorio' : 'Raccomandato'}
            </span>
          </li>
        `).join('')}
      </ul>
    `;
  } else {
    prerequisitesElement.innerHTML = '<p>Nessun prerequisito richiesto</p>';
  }

  // Aggiorna link
  const linkElement = document.getElementById('module-details-link');
  const noLinkElement = document.getElementById('module-details-no-link');
  if (module.link) {
    linkElement.href = module.link;
    linkElement.style.display = 'block';
    noLinkElement.style.display = 'none';
  } else {
    linkElement.style.display = 'none';
    noLinkElement.style.display = 'block';
  }

  // Mostra la sidebar
  moduleDetailsSidebar.classList.remove('hidden');
  if (window.innerWidth <= 1024) {
    moduleDetailsSidebar.classList.add('open');
  }
}

/**
 * Chiudi sidebar dettagli
 */
function closeModuleDetails() {
  moduleDetailsSidebar.classList.add('hidden');
  if (window.innerWidth <= 1024) {
    moduleDetailsSidebar.classList.remove('open');
  }
  // NON rimuovere dalla session storage per mantenere la persistenza tra viste
  // NON resettare selectedModuleId per mantenere la persistenza tra viste
  if (document.getElementById('graph-view').style.display === 'block') {
    renderGraph(); // Riricarica il grafo per rimuovere l'evidenziazione
  } else {
    renderModules(); // Riricarica la tabella per rimuovere l'evidenziazione
  }
}

/**
 * Funzione per evidenziare la riga selezionata nella tabella
 */
function highlightSelectedTableRow(moduleId) {
  // Rimuovi evidenziazione precedente
  tableBody.querySelectorAll('tr').forEach(row => {
    row.classList.remove('selected');
  });
  
  // Evidenzia la riga corrente
  const selectedRow = tableBody.querySelector(`tr[data-id="${moduleId}"]`);
  if (selectedRow) {
    selectedRow.classList.add('selected');
  }
}

/**
 * Funzione per trovare ricorsivamente tutte le dipendenze di un modulo
 */
function findDependencyChain(moduleId, dependencies, visited = new Set()) {
  if (visited.has(moduleId)) return new Set();
  visited.add(moduleId);
  
  const chain = new Set([moduleId]);
  const directDeps = dependencies.filter(d => d.moduleId === moduleId);
  
  for (const dep of directDeps) {
    const subChain = findDependencyChain(dep.prerequisiteId, dependencies, visited);
    subChain.forEach(id => chain.add(id));
  }
  
  return chain;
}

/**
 * Funzione per salvare il modulo selezionato nella session storage
 */
function saveSelectedModule(moduleId) {
  try {
    sessionStorage.setItem('selectedModuleId', moduleId);
    console.log(`💾 Saved module ${moduleId} to sessionStorage`);
  } catch (error) {
    console.warn('⚠️ Impossibile salvare modulo selezionato in sessionStorage:', error);
  }
}

/**
 * Funzione per caricare il modulo selezionato dalla session storage
 */
function loadSelectedModule() {
  try {
    const savedModuleId = sessionStorage.getItem('selectedModuleId');
    if (savedModuleId) {
      selectedModuleId = Number(savedModuleId);
      console.log(`📂 Loaded module ${selectedModuleId} from sessionStorage`);
      return selectedModuleId;
    } else {
      console.log('📂 No saved module found in sessionStorage');
    }
  } catch (error) {
    console.warn('⚠️ Impossibile caricare modulo selezionato da sessionStorage:', error);
  }
  return null;
}

/**
 * Funzione per rimuovere il modulo selezionato dalla session storage
 */
function clearSelectedModule() {
  try {
    sessionStorage.removeItem('selectedModuleId');
  } catch (error) {
    console.warn('⚠️ Impossibile rimuovere modulo selezionato da sessionStorage:', error);
  }
}

/**
 * Funzione principale di render con editing inline
 */
async function renderModules() {
  if (renderingInProgress) return;  // previene doppi richiami sovrapposti
  renderingInProgress = true;

  // Pulisce la tabella
  tableBody.innerHTML = '';

  const fStatus = document.getElementById('filter-status').value;
  const fTeaching = document.getElementById('filter-teaching').value;
  const query = document.getElementById('search-modules').value.toLowerCase().trim();
  const showOnlyUnlocked = document.getElementById('filter-unlocked').checked;

  const [modules, progress, assessments, dependencies] = await Promise.all([
    db.modules.toArray(),
    db.progress.toArray(),
    db.assessments.toArray(),
    db.dependencies.toArray()
  ]);

  const pMap = new Map(progress.map(p => [p.moduleId, p]));
  const aMap = new Map(assessments.map(a => [a.moduleId, a]));

  const filteredModules = modules.filter(m => {
    const p = pMap.get(m.id);
    const status = p?.status ?? 'not-started';

    const matchTeaching =
      fTeaching === 'all' ||
      (m.teachingArea && m.teachingArea.toLowerCase().trim() === fTeaching.toLowerCase().trim());
    const matchStatus = fStatus === 'all' || status === fStatus;
    const matchQuery = !query || m.title.toLowerCase().includes(query);

    if (!matchTeaching || !matchStatus || !matchQuery) return false;

    if (showOnlyUnlocked) {
      const prereqs = dependencies.filter(d => d.moduleId === m.id).map(d => d.prerequisiteId);
      if (prereqs.length > 0) {
        const allDone = prereqs.every(pid => {
          const pr = progress.find(p => p.moduleId === pid);
          return pr && pr.status === 'completed';
        });
        if (!allDone) return false;
      }
    }

    return true;
  });

  // Costruisce righe
  for (const m of filteredModules) {
    const p = pMap.get(m.id);
    const a = aMap.get(m.id);
    const status = p?.status ?? 'not-started';

    const tr = document.createElement('tr');
    tr.setAttribute('data-id', m.id);
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td>${
        m.link
          ? '<a href="' + m.link + '" target="_blank" class="module-link">' + m.title + '</a>'
          : '<span class="module-title">' + m.title + '</span>'
      }</td>
      <td>${m.teachingArea ?? '-'}</td>
      <td>
        <select class="status-select" data-id="${m.id}">
          <option value="not-started" ${status === 'not-started' ? 'selected' : ''}>⏳ Da iniziare</option>
          <option value="in-progress" ${status === 'in-progress' ? 'selected' : ''}>🔄 In corso</option>
          <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ Completato</option>
        </select>
      </td>
      <td>
        <input type="checkbox" class="applied-check" data-id="${m.id}" ${a?.practicalApplied ? 'checked' : ''}>
      </td>
      <td>
        <select class="quality-select" data-id="${m.id}">
          <option value="-">-</option>
          <option value="1" ${a?.resultQuality == 1 ? 'selected' : ''}>Scarso</option>
          <option value="2" ${a?.resultQuality == 2 ? 'selected' : ''}>Basso</option>
          <option value="3" ${a?.resultQuality == 3 ? 'selected' : ''}>Medio</option>
          <option value="4" ${a?.resultQuality == 4 ? 'selected' : ''}>Buono</option>
          <option value="5" ${a?.resultQuality == 5 ? 'selected' : ''}>Ottimo</option>
        </select>
      </td>
    `;
    tableBody.appendChild(tr);
  }

  // Listener per click sulle righe della tabella
  tableBody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', async (e) => {
      // Previene l'apertura del link quando si clicca sul titolo
      if (e.target.tagName === 'A' || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') {
        return;
      }
      const moduleId = Number(row.dataset.id);
      await showModuleDetails(moduleId);
      
      // Salva il modulo selezionato per persistenza tra viste
      saveSelectedModule(moduleId);
      
      // Evidenzia la riga selezionata
      highlightSelectedTableRow(moduleId);
    });
  });
  
  // Evidenzia il modulo selezionato se presente
  const savedModuleId = loadSelectedModule();
  if (savedModuleId) {
    highlightSelectedTableRow(savedModuleId);
  }

  // Listener per i link dei moduli (per evitare che il click sulla riga interferisca)
  tableBody.querySelectorAll('.module-link').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.stopPropagation(); // Previene che il click sulla riga venga attivato
      
      // Ottieni l'ID del modulo dal link
      const row = link.closest('tr');
      const moduleId = Number(row.dataset.id);
      
      // Verifica se il modulo è in stato "Da iniziare" e aggiorna automaticamente a "In corso"
      const statusSelect = row.querySelector('.status-select');
      if (statusSelect && statusSelect.value === 'not-started') {
        try {
          await ProgressManager.updateProgress(moduleId, 'in-progress', {});
          // Aggiorna l'interfaccia per riflettere il cambiamento
          await renderModules();
        } catch (error) {
          console.error('Errore nell\'aggiornamento automatico dello stato:', error);
        }
      }
    });
  });

  // Listener inline
  tableBody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async e => {
      const id = Number(e.target.dataset.id);
      const val = e.target.value;
      await ProgressManager.updateProgress(id, val, {});
      await renderModules();
    });
  });

  tableBody.querySelectorAll('.applied-check').forEach(chk => {
    chk.addEventListener('change', async e => {
      const id = Number(e.target.dataset.id);
      let a = await db.assessments.where('moduleId').equals(id).first();
      if (!a) a = { moduleId: id, progressId: id };
      a.practicalApplied = e.target.checked;
      await AssessmentManager.upsertAssessment(id, id, a);
      await renderModules();
    });
  });

  // Quality select listener
  tableBody.querySelectorAll('.quality-select').forEach(sel => {
    sel.addEventListener('change', async e => {
      const id = Number(e.target.dataset.id);
      const val = e.target.value === '-' ? null : Number(e.target.value);
      let a = await db.assessments.where('moduleId').equals(id).first();
      if (!a) a = { moduleId: id, progressId: id };
      a.resultQuality = val;
      await AssessmentManager.upsertAssessment(id, id, a);
      
      // If a quality value is selected (not '-'), automatically check "Praticato" and set status to "completed"
      if (val !== null) {
        // Check the "Praticato" checkbox
        a.practicalApplied = true;
        await AssessmentManager.upsertAssessment(id, id, a);
        
        // Set status to "completed"
        await ProgressManager.updateProgress(id, 'completed', {});
      }
      
      await renderModules();
    });
  });

  renderingInProgress = false; // sblocco sempre a fine
}
  
// Funzione per renderizzare il grafo delle dipendenze
async function renderGraph(forceRender = false) {
  // Skip if already rendering and not forced
  if (graphRenderingInProgress && !forceRender) {
    return;
  }
  
  // Set rendering flag
  graphRenderingInProgress = true;
  
  try {
    
    const svg = d3.select('#module-graph');
    
    // Clear everything more thoroughly
    svg.selectAll('*').remove();
    
    // Reset della simulazione precedente se esiste
    if (window.currentSimulation) {
      window.currentSimulation.stop();
      window.currentSimulation = null;
    }
    
    // Ensure the graph view is actually visible before rendering
    if (document.getElementById('graph-view').style.display === 'none') {
      return;
    }

  const fStatus = document.getElementById('filter-status').value;
  const fTeaching = document.getElementById('filter-teaching').value;
  const query = document.getElementById('search-modules').value.toLowerCase().trim();
  const showOnlyUnlocked = document.getElementById('filter-unlocked').checked;

  const [modules, progress, dependencies] = await Promise.all([
    db.modules.toArray(),
    db.progress.toArray(),
    db.dependencies.toArray()
  ]);

  const pMap = new Map(progress.map(p => [p.moduleId, p]));

  // Filtra moduli come nella tabella
  const filteredModules = modules.filter(m => {
    const p = pMap.get(m.id);
    const status = p?.status ?? 'not-started';

    const matchTeaching =
      fTeaching === 'all' ||
      (m.teachingArea && m.teachingArea.toLowerCase().trim() === fTeaching.toLowerCase().trim());
    const matchStatus = fStatus === 'all' || status === fStatus;
    const matchQuery = !query || m.title.toLowerCase().includes(query);

    if (!matchTeaching || !matchStatus || !matchQuery) return false;

    if (showOnlyUnlocked) {
      const prereqs = dependencies.filter(d => d.moduleId === m.id).map(d => d.prerequisiteId);
      if (prereqs.length > 0) {
        const allDone = prereqs.every(pid => {
          const pr = progress.find(p => p.moduleId === pid);
          return pr && pr.status === 'completed';
        });
        if (!allDone) return false;
      }
    }

    return true;
  });

  if (filteredModules.length === 0) {
    svg.append('text')
      .attr('x', '50%')
      .attr('y', '50%')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '16px')
      .style('fill', '#666')
      .text('Nessun modulo corrisponde ai filtri selezionati');
    return;
  }

  // Crea nodi e collegamenti per il grafo
  const nodes = filteredModules.map(m => ({
    id: m.id,
    title: m.title,
    code: m.code,
    status: pMap.get(m.id)?.status || 'not-started'
  }));

  const links = dependencies.filter(d =>
    filteredModules.some(m => m.id === d.moduleId) &&
    filteredModules.some(m => m.id === d.prerequisiteId)
  ).map(d => ({
    source: d.prerequisiteId,
    target: d.moduleId,
    type: d.dependencyType
  }));

  // Configurazione D3 force layout con zoom
  const width = svg.node().getBoundingClientRect().width;
  const height = svg.node().getBoundingClientRect().height;

  // Crea un gruppo per contenere tutti gli elementi del grafo
  const g = svg.append('g');

  // Configura zoom
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(100)) // Increased distance for better spacing
    .force('charge', d3.forceManyBody().strength(-50)) // Reduced repulsion for more relaxed layout
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(150)); // Slightly increased collision radius
  
  // Store the simulation reference for cleanup
  window.currentSimulation = simulation;

  // Crea elementi SVG all'interno del gruppo zoomabile
  const link = g.append('g')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke', d => d.type === 'mandatory' ? '#e74c3c' : '#8000E5')
    .attr('stroke-width', d => d.type === 'mandatory' ? 2 : 1)
    .attr('stroke-dasharray', d => d.type === 'mandatory' ? 'none' : '5,5')
    .attr('marker-end', 'url(#arrowhead)');

  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .enter().append('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  // Crea cerchi per i nodi - più grandi per contenere testo su più righe
  node.append('circle')
    .attr('r', 35)
    .attr('fill', d => {
      switch(d.status) {
        case 'completed': return '#28a745';
        case 'in-progress': return '#FFDA00';
        default: return '#666666';
      }
    })
    .attr('stroke', d => {
      // Check if module is unlocked (no dependencies or all dependencies satisfied)
      const moduleDependencies = dependencies.filter(dep => dep.moduleId === d.id);
      if (moduleDependencies.length === 0) {
        return '#FFDA00'; // Yellow border for modules without dependencies
      } else {
        const allDependenciesSatisfied = moduleDependencies.every(dep => {
          const prereqProgress = progress.find(p => p.moduleId === dep.prerequisiteId);
          return prereqProgress && prereqProgress.status === 'completed';
        });
        return allDependenciesSatisfied ? '#FFDA00' : '#FFFFFF'; // Yellow border if all dependencies satisfied
      }
    })
    .attr('stroke-width', d => {
      // Check if module is unlocked (no dependencies or all dependencies satisfied)
      const moduleDependencies = dependencies.filter(dep => dep.moduleId === d.id);
      if (moduleDependencies.length === 0) {
        return 3; // Thicker border for modules without dependencies
      } else {
        const allDependenciesSatisfied = moduleDependencies.every(dep => {
          const prereqProgress = progress.find(p => p.moduleId === dep.prerequisiteId);
          return prereqProgress && prereqProgress.status === 'completed';
        });
        return allDependenciesSatisfied ? 3 : 2; // Thicker border if all dependencies satisfied
      }
    })
    .style('cursor', 'pointer');

  // Aggiungi testo ai nodi - mostra titolo completo su più righe
  node.append('text')
    .selectAll('tspan')
    .data(d => {
      // Suddivide il titolo in righe di massimo 3 parole ciascuna
      const words = d.title.split(' ');
      const lines = [];
      let currentLine = [];
      
      words.forEach(word => {
        currentLine.push(word);
        if (currentLine.length >= 2) {
          lines.push(currentLine.join(' '));
          currentLine = [];
        }
      });
      
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }
      
      return lines;
    })
    .enter()
    .append('tspan')
    .text(d => d)
    .attr('x', 0)
    .attr('dy', (d, i) => i === 0 ? '-0.6em' : '1.2em')
    .attr('text-anchor', 'middle')
    .style('font-size', '7px')
    .style('fill', '#FFFFFF')
    .style('font-weight', 'bold')
    .style('pointer-events', 'none');

  // Tooltip per i nodi
  node.append('title')
    .text(d => {
      const moduleDependencies = dependencies.filter(dep => dep.moduleId === d.id);
      const isUnlocked = moduleDependencies.length === 0 ||
        moduleDependencies.every(dep => {
          const prereqProgress = progress.find(p => p.moduleId === dep.prerequisiteId);
          return prereqProgress && prereqProgress.status === 'completed';
        });
      
      const unlockStatus = isUnlocked ? 'Sbloccato' : 'Bloccato';
      return `${d.title}\nCodice: ${d.code}\nStato: ${getStatusText(d.status)}\nAccesso: ${unlockStatus}`;
    });

  // Click sui nodi per mostrare dettagli e evidenziare dipendenze
  node.on('click', async (event, d) => {
    await showModuleDetails(d.id);
    
    // Salva il modulo selezionato per persistenza tra viste
    saveSelectedModule(d.id);
    console.log(`📊 Graph: Module ${d.id} selected and saved`);
    
    // Evidenzia la catena di dipendenze
    highlightDependencyChain(d.id, dependencies, node, link);
  });

  // Definisce il marker per le frecce
  const defs = svg.append('defs');
  
  // Freccia per dipendenze obbligatorie (rosso)
  defs.append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 40) // Posizione della freccia lungo la linea
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#e74c3c');

  // Freccia per dipendenze raccomandate (viola)
  defs.append('marker')
    .attr('id', 'arrowhead-recommended')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 40)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#8000E5');

  // Aggiungi istruzioni per lo zoom
  svg.append('text')
    .attr('x', 10)
    .attr('y', 20)
    .attr('text-anchor', 'start')
    .style('font-size', '12px')
    .style('fill', '#666666')
    .style('pointer-events', 'none')
    .text('Zoom: Rotella mouse | Pan: Trascina');

  // Aggiungi legenda per i tipi di dipendenze
  const legend = svg.append('g')
    .attr('transform', 'translate(10, 40)');

  // Legenda per dipendenze obbligatorie
  legend.append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 20)
    .attr('y2', 0)
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead)');

  legend.append('text')
    .attr('x', 25)
    .attr('y', 0)
    .attr('dy', '0.35em')
    .style('font-size', '12px')
    .style('fill', '#666666')
    .style('pointer-events', 'none')
    .text('Obbligatoria');

  // Legenda per catena di dipendenze evidenziate
  legend.append('line')
    .attr('x1', 0)
    .attr('y1', 20)
    .attr('x2', 20)
    .attr('y2', 20)
    .attr('stroke', '#FFDA00')
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', '5,3');

  legend.append('text')
    .attr('x', 25)
    .attr('y', 20)
    .attr('dy', '0.35em')
    .style('font-size', '12px')
    .style('fill', '#666666')
    .style('pointer-events', 'none')
    .text('Dipendenze evidenziate');

  // Aggiorna posizioni
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('marker-end', d => d.type === 'mandatory' ? 'url(#arrowhead)' : 'url(#arrowhead-recommended)');

    node
      .attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Evidenzia automaticamente il modulo selezionato se presente
  const savedModuleId = loadSelectedModule();
  
  if (savedModuleId) {
    // Check if the saved module exists in the current filtered nodes
    const savedModuleExists = filteredModules.some(m => m.id === savedModuleId);
    
    if (savedModuleExists) {
      // Show module details and highlight dependency chain
      await showModuleDetails(savedModuleId);
      
      // Highlight immediately and also after simulation stabilizes
      highlightDependencyChain(savedModuleId, dependencies, node, link);
      
      // Also highlight after a delay to ensure simulation has stabilized
      setTimeout(() => {
        highlightDependencyChain(savedModuleId, dependencies, node, link);
      }, 1500);
    }
  }

  // Funzione per evidenziare la catena di dipendenze
  function highlightDependencyChain(moduleId, dependencies, nodeElements, linkElements) {
    // Reset precedente evidenziazione
    nodeElements.selectAll('circle')
      .attr('stroke', d => {
        const moduleDependencies = dependencies.filter(dep => dep.moduleId === d.id);
        if (moduleDependencies.length === 0) {
          return '#FFDA00'; // Yellow border for modules without dependencies
        } else {
          const allDependenciesSatisfied = moduleDependencies.every(dep => {
            const prereqProgress = progress.find(p => p.moduleId === dep.prerequisiteId);
            return prereqProgress && prereqProgress.status === 'completed';
          });
          return allDependenciesSatisfied ? '#FFDA00' : '#FFFFFF'; // Yellow border if all dependencies satisfied
        }
      })
      .attr('stroke-width', d => {
        const moduleDependencies = dependencies.filter(dep => dep.moduleId === d.id);
        if (moduleDependencies.length === 0) {
          return 3; // Thicker border for modules without dependencies
        } else {
          const allDependenciesSatisfied = moduleDependencies.every(dep => {
            const prereqProgress = progress.find(p => p.moduleId === dep.prerequisiteId);
            return prereqProgress && prereqProgress.status === 'completed';
          });
          return allDependenciesSatisfied ? 3 : 2; // Thicker border if all dependencies satisfied
        }
      })
      .attr('stroke-dasharray', 'none');

    linkElements
      .attr('stroke', d => d.type === 'mandatory' ? '#e74c3c' : '#8000E5')
      .attr('stroke-width', d => d.type === 'mandatory' ? 2 : 1)
      .attr('stroke-dasharray', d => d.type === 'mandatory' ? 'none' : '5,5');

    // Se è lo stesso modulo, deseleziona
    if (selectedModuleId === moduleId) {
      selectedModuleId = null;
      return;
    }

    selectedModuleId = moduleId;

    try {
      if (typeof findDependencyChain !== 'function') {
        console.warn('findDependencyChain function not found');
        return;
      }
      
      // Trova tutte le dipendenze ricorsive
      const dependencyChain = findDependencyChain(moduleId, dependencies);
      console.log(`🔗 Dependency chain for module ${moduleId}:`, Array.from(dependencyChain));
      
      // Evidenzia i nodi nella catena
      const highlightedNodes = nodeElements.selectAll('circle')
        .filter(d => dependencyChain.has(d.id));
      
      console.log(`🎯 Highlighting ${highlightedNodes.size()} nodes in dependency chain`);
      
      highlightedNodes
        .attr('stroke', '#FFDA00') // Primary yellow
        .attr('stroke-width', 4)
        .attr('stroke-dasharray', '5,3'); // Dotted line

      // Evidenzia i link nella catena
      const highlightedLinks = linkElements
        .filter(d => dependencyChain.has(d.source.id) && dependencyChain.has(d.target.id));
      
      console.log(`🔗 Highlighting ${highlightedLinks.size()} links in dependency chain`);
      
      highlightedLinks
        .attr('stroke', '#FFDA00') // Primary yellow
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '5,3'); // Dotted line
    } catch (error) {
      console.error('❌ Error in highlightDependencyChain:', error);
    }
  }

  // Funzioni drag
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  function getStatusText(status) {
    switch(status) {
      case 'completed': return 'Completato';
      case 'in-progress': return 'In corso';
      default: return 'Da iniziare';
    }
  }
  } catch (error) {
    console.error('❌ Errore nel rendering del grafo:', error);
    const svg = d3.select('#module-graph');
    svg.selectAll('*').remove();
    svg.append('text')
      .attr('x', '50%')
      .attr('y', '50%')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '14px')
      .style('fill', '#dc3545')
      .text('Errore nel caricamento del grafo: ' + error.message);
  } finally {
    graphRenderingInProgress = false;
  }
}

/**
 * Setup event listeners per view switching
 */
function setupEventListeners() {
  console.log('🎯 Setup event listeners per view switching...');
  
  // View switching buttons
  const tableBtn = document.getElementById('table-view-btn');
  const graphBtn = document.getElementById('graph-view-btn');
  const dashboardBtn = document.getElementById('dashboard-view-btn');
  
  if (tableBtn) {
    tableBtn.addEventListener('click', async () => {
      switchView('table');
      await renderModules(); // forza aggiornamento coerente ai filtri
      
      // Evidenzia il modulo selezionato dopo il rendering
      const savedModuleId = loadSelectedModule();
      if (savedModuleId) {
        highlightSelectedTableRow(savedModuleId);
      }
    });
  }
  
  if (graphBtn) {
    graphBtn.addEventListener('click', async () => {
      switchView('graph');
      // Force graph rendering when switching views - ensure it always renders
      await renderGraph(true); // forza aggiornamento coerente ai filtri
    });
  }
  
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => switchView('dashboard'));
  }

  // Collega eventi ai filtri
  ['filter-status','filter-teaching','search-modules','filter-unlocked']
    .forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', async () => {
          if (document.getElementById('graph-view').style.display === 'block') {
            await renderGraph();
          } else {
            await renderModules();
          }
        });
      }
    });

  const filterUnlocked = document.getElementById('filter-unlocked');
  if (filterUnlocked) {
    filterUnlocked.addEventListener('change', renderModules);
  }

  // Gestione apertura/chiusura menu mobile
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menu-toggle');
  const detailsBtn = document.getElementById('details-toggle');

  if (menuBtn) {
    menuBtn.addEventListener('click', e => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });
  }

  if (detailsBtn) {
    detailsBtn.addEventListener('click', e => {
      e.stopPropagation();
      moduleDetailsSidebar.classList.toggle('open');
    });
  }

  // Chiudi sidebar cliccando fuori
  document.addEventListener('click', e => {
    const clickInsideSidebar = sidebar.contains(e.target);
    const clickOnButton = e.target === menuBtn;
    if (!clickInsideSidebar && !clickOnButton && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
    
    // Chiudi sidebar dettagli cliccando fuori
    const clickInsideDetailsSidebar = moduleDetailsSidebar.contains(e.target);
    const clickOnDetailsButton = e.target === detailsBtn;
    if (!clickInsideDetailsSidebar && !clickOnDetailsButton && moduleDetailsSidebar.classList.contains('open')) {
      moduleDetailsSidebar.classList.remove('open');
    }
    
    // Chiudi sidebar dettagli cliccando fuori dalla tabella e dalla sidebar
    const clickInsideTable = tableBody.contains(e.target);
    const clickInsideGraph = document.getElementById('graph-view').contains(e.target);
    if (!clickInsideTable && !clickInsideDetailsSidebar && !clickInsideGraph && !moduleDetailsSidebar.classList.contains('hidden')) {
      closeModuleDetails();
    }
  });

  // Theme switching functionality
  const lightThemeBtn = document.getElementById('light-theme-btn');
  const darkThemeBtn = document.getElementById('dark-theme-btn');

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Update active theme button
  if (savedTheme === 'dark') {
    if (darkThemeBtn) darkThemeBtn.classList.add('active');
    if (lightThemeBtn) lightThemeBtn.classList.remove('active');
  } else {
    if (lightThemeBtn) lightThemeBtn.classList.add('active');
    if (darkThemeBtn) darkThemeBtn.classList.remove('active');
  }

  // Theme switching event listeners
  if (lightThemeBtn) {
    lightThemeBtn.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      lightThemeBtn.classList.add('active');
      darkThemeBtn.classList.remove('active');
    });
  }

  if (darkThemeBtn) {
    darkThemeBtn.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      darkThemeBtn.classList.add('active');
      lightThemeBtn.classList.remove('active');
    });
  }

  // Backup functionality
  const exportBackupBtn = document.getElementById('export-backup-btn');
  const importBackupBtn = document.getElementById('import-backup-btn');
  const shareBackupBtn = document.getElementById('share-backup-btn');
  const importModal = document.getElementById('import-modal');
  const shareModal = document.getElementById('share-modal');
  const importForm = document.getElementById('import-form');
  const backupFileInput = document.getElementById('backup-file');
  const backupTextArea = document.getElementById('backup-text');
  const copyBackupBtn = document.getElementById('copy-backup-btn');
  const closeShareBtn = document.getElementById('close-share-btn');
  const cancelImportBtn = document.getElementById('cancel-import-btn');

  if (exportBackupBtn) {
    exportBackupBtn.addEventListener('click', async () => {
      try {
        await BackupManager.exportBackup();
        alert('✅ Backup esportato con successo!');
      } catch (error) {
        console.error('Errore esportazione backup:', error);
        alert('❌ Errore durante l\'esportazione del backup');
      }
    });
  }

  if (importBackupBtn) {
    importBackupBtn.addEventListener('click', () => {
      importModal.classList.add('active');
    });
  }

  if (cancelImportBtn) {
    cancelImportBtn.addEventListener('click', () => {
      importModal.classList.remove('active');
      importForm.reset();
    });
  }

  if (importForm) {
    importForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const file = backupFileInput.files[0];
      if (!file) {
        alert('❌ Seleziona un file di backup');
        return;
      }

      try {
        const result = await BackupManager.importBackup(file);
        
        if (result.success) {
          alert(`✅ Backup importato con successo!\nProgressi: ${result.importedProgress}\nValutazioni: ${result.importedAssessments}`);
          
          // Ricarica la tabella per mostrare i nuovi dati
          await renderModules();
        } else {
          alert(`⚠️ Backup importato con errori:\n${result.errors.join('\n')}`);
        }
        
        importModal.classList.remove('active');
        importForm.reset();
      } catch (error) {
        console.error('Errore import backup:', error);
        alert('❌ Errore durante l\'importazione del backup: ' + error.message);
      }
    });
  }

  if (shareBackupBtn) {
    shareBackupBtn.addEventListener('click', async () => {
      try {
        const backupString = await BackupManager.generateBackupString();
        backupTextArea.value = backupString;
        shareModal.classList.add('active');
      } catch (error) {
        console.error('Errore generazione backup:', error);
        alert('❌ Errore durante la generazione del backup');
      }
    });
  }

  if (copyBackupBtn) {
    copyBackupBtn.addEventListener('click', () => {
      backupTextArea.select();
      document.execCommand('copy');
      alert('✅ Backup copiato negli appunti!');
    });
  }

  if (closeShareBtn) {
    closeShareBtn.addEventListener('click', () => {
      shareModal.classList.remove('active');
    });
  }

  // Chiudi modali cliccando fuori
  document.addEventListener('click', (e) => {
    if (e.target === importModal) {
      importModal.classList.remove('active');
      importForm.reset();
    }
    if (e.target === shareModal) {
      shareModal.classList.remove('active');
    }
  });
  
  console.log('✅ Event listeners view switching pronti');
}

/**
 * Inizializza vista dashboard
 */
async function initDashboardView() {
  try {
    console.log('📊 Inizializzazione vista dashboard...');
    await window.dashboardView.init();
    console.log('✅ Vista dashboard inizializzata');
  } catch (error) {
    console.error('❌ Errore inizializzazione dashboard:', error);
  }
}

/**
 * Switch tra viste
 */
function switchView(viewType) {
  console.log(`🔄 Cambio vista: ${viewType}`);
  
  // Nascondi tutte le viste
  const tableView = document.getElementById('table-view');
  const graphView = document.getElementById('graph-view');
  const dashboardView = document.getElementById('dashboard-view');
  
  if (tableView) tableView.style.display = 'none';
  if (graphView) graphView.style.display = 'none';
  if (dashboardView) dashboardView.style.display = 'none';
  
  // Aggiorna stato bottoni
  const tableBtn = document.getElementById('table-view-btn');
  const graphBtn = document.getElementById('graph-view-btn');
  const dashboardBtn = document.getElementById('dashboard-view-btn');
  
  if (tableBtn) tableBtn.classList.remove('active');
  if (graphBtn) graphBtn.classList.remove('active');
  if (dashboardBtn) dashboardBtn.classList.remove('active');
  
  // Mostra vista selezionata
  switch (viewType) {
    case 'table':
      if (tableView) tableView.style.display = 'block';
      if (tableBtn) tableBtn.classList.add('active');
      break;
      
    case 'graph':
      if (graphView) graphView.style.display = 'block';
      if (graphBtn) graphBtn.classList.add('active');
      break;
      
    case 'dashboard':
      if (dashboardView) dashboardView.style.display = 'block';
      if (dashboardBtn) dashboardBtn.classList.add('active');
      // Refresh dashboard data
      window.dashboardView.init().catch(console.error);
      break;
  }
  
  // Gestione filtro area didattica se presente
  handleTeachingAreaFilter(viewType);
}

/**
 * Gestione filtro area didattica per navigazione da dashboard
 */
function handleTeachingAreaFilter(viewType) {
  if (viewType === 'table') {
    const filterArea = sessionStorage.getItem('filterTeachingArea');
    if (filterArea) {
      console.log(`🎯 Applicando filtro area: ${filterArea}`);
      // Qui verrà implementato il filtro nella vista tabella
      // Per ora rimuoviamo il filtro dalla session storage
      sessionStorage.removeItem('filterTeachingArea');
    }
  }
}

/**
 * Mostra messaggio di errore
 */
function showError(message) {
  console.error(`❌ ${message}`);
  // Nelle fasi successive questo mostrerà un toast/modal
}

// Esponi funzioni globali per testing da console
window.CiclofficinaTracker = {
  db,
  ModuleManager,
  DependencyManager,
  ProgressManager,
  AssessmentManager,
  MigrationManager,
  LevelDataLoader,
  LevelMigrationManager,
  AddNewModules,
  displayStats,
  
  // Utility per test schema esteso
  async testExtendedSchema() {
    console.log('🧪 Test Schema Esteso 1.1.0');
    
    try {
      // Test skill tags
      const allTags = await ModuleManager.getAllSkillTags();
      console.log('🏷️ Skill Tags disponibili:', allTags);
      
      // Test content path
      const modules = await ModuleManager.getAllModules();
      const withContentPath = modules.filter(m => m.contentPath);
      console.log(`📁 Moduli con contentPath: ${withContentPath.length}/${modules.length}`);
      
      // Test revision date
      const needsRevision = await ModuleManager.getModulesNeedingRevision(30);
      console.log(`📅 Moduli da revisionare: ${needsRevision.length}`);
      
      return {
        totalModules: modules.length,
        modulesWithContentPath: withContentPath.length,
        skillTags: allTags,
        needsRevision: needsRevision.length
      };
    } catch (error) {
      console.error('❌ Errore test schema esteso:', error);
      throw error;
    }
  },

  // Utility per test struttura modulare
  async testModularStructure() {
    console.log('🧪 Test Struttura Modulare a Livelli');
    
    try {
      await LevelDataLoader.loadAllLevels();
      const stats = LevelDataLoader.getStats();
      const modules = LevelDataLoader.getAllModules();
      
      console.log('📊 Statistiche struttura modulare:');
      console.log(`   - Livelli: ${stats.levels}`);
      console.log(`   - Moduli: ${stats.modules}`);
      console.log(`   - Aree didattiche: ${stats.teachingAreas.join(', ')}`);
      
      // Mostra esempio di conversione
      if (modules.length > 0) {
        const sample = modules[0];
        console.log('\n📝 Esempio modulo convertito:');
        console.log(`   - Codice: ${sample.code}`);
        console.log(`   - Titolo: ${sample.title}`);
        console.log(`   - Area: ${sample.teachingArea}`);
        console.log(`   - Content Path: ${sample.contentPath}`);
      }
      
      return {
        levels: stats.levels,
        modules: stats.modules,
        teachingAreas: stats.teachingAreas,
        sampleModule: modules[0] || null
      };
    } catch (error) {
      console.error('❌ Errore test struttura modulare:', error);
      throw error;
    }
  },

  // Utility per verifica migrazione
  async checkMigration() {
    console.log('🔄 Verifica migrazione a struttura modulare');
    
    try {
      const compatibility = await LevelMigrationManager.checkCompatibility();
      const migrationNeeded = await LevelMigrationManager.needsLevelMigration();
      
      console.log('📋 Risultato verifica:');
      console.log(`   - Migrazione raccomandata: ${migrationNeeded ? 'SI' : 'NO'}`);
      console.log(`   - Può migrare: ${compatibility.compatibility.canMigrate ? 'SI' : 'NO'}`);
      console.log(`   - Perdita dati: ${compatibility.compatibility.dataLoss ? 'SI' : 'NO'}`);
      console.log(`   - Nuovi moduli: ${compatibility.compatibility.newModules}`);
      
      if (compatibility.compatibility.dataLoss) {
        console.log(`\n⚠️  Attenzione: ${compatibility.details.comparison.uniqueToCurrentCodes.length} moduli esistenti non presenti nella nuova struttura`);
      }
      
      return compatibility;
    } catch (error) {
      console.error('❌ Errore verifica migrazione:', error);
      throw error;
    }
  },

  // Utility per setup pulito con struttura modulare
  async cleanSetup() {
    console.log('🧹 Setup pulito con struttura modulare');
    
    try {
      // Cancella tutti i dati esistenti
      await db.delete();
      await db.open();
      
      console.log('🗑️ Database pulito, caricamento struttura modulare...');
      
      // Carica struttura modulare
      await LevelDataLoader.loadAllLevels();
      const modules = LevelDataLoader.getAllModules();
      
      // Importa moduli
      await ModuleManager.bulkImportModules(modules);
      console.log(`✅ Importati ${modules.length} moduli dalla struttura modulare`);
      
      // Crea dipendenze
      const dbModules = await db.modules.toArray();
      const moduleMap = new Map(dbModules.map(m => [m.code, m.id]));
      
      let dependencyCount = 0;
      for (const module of modules) {
        if (module.prerequisites && module.prerequisites.length > 0) {
          for (const prereqCode of module.prerequisites) {
            const moduleId = moduleMap.get(module.code);
            const prerequisiteId = moduleMap.get(prereqCode);
            
            if (moduleId && prerequisiteId) {
              await DependencyManager.addDependency(moduleId, prerequisiteId, 'mandatory');
              dependencyCount++;
            }
          }
        }
      }
      
      console.log(`✅ Create ${dependencyCount} dipendenze`);
      
      // Mostra statistiche
      const stats = LevelDataLoader.getStats();
      console.log('\n📊 SETUP COMPLETATO');
      console.log('===================');
      console.log(`Livelli: ${stats.levels}`);
      console.log(`Moduli: ${stats.modules}`);
      console.log(`Aree didattiche: ${stats.teachingAreas.join(', ')}`);
      console.log('===================\n');
      
      return {
        success: true,
        modules: modules.length,
        dependencies: dependencyCount,
        levels: stats.levels
      };
      
    } catch (error) {
      console.error('❌ Errore setup pulito:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Utility per verifica stato corrente
  async checkStatus() {
    console.log('📋 Verifica stato corrente');
    
    try {
      const moduleCount = await db.modules.count();
      const progressCount = await db.progress.count();
      const assessmentCount = await db.assessments.count();
      const dependencyCount = await db.dependencies.count();
      
      console.log('📊 STATO DATABASE:');
      console.log(`   - Moduli: ${moduleCount}`);
      console.log(`   - Progressi: ${progressCount}`);
      console.log(`   - Valutazioni: ${assessmentCount}`);
      console.log(`   - Dipendenze: ${dependencyCount}`);
      
      // Verifica se i dati provengono da struttura modulare
      const modules = await db.modules.toArray();
      const modularModules = modules.filter(m => m.code && m.code.includes('BIKE-'));
      const oldModules = modules.filter(m => m.code && m.code.includes('BIKE-0'));
      
      console.log('\n📚 TIPOLOGIA MODULI:');
      console.log(`   - Moduli struttura modulare: ${modularModules.length}`);
      console.log(`   - Moduli schema vecchio: ${oldModules.length}`);
      
      return {
        moduleCount,
        progressCount,
        assessmentCount,
        dependencyCount,
        modularModules: modularModules.length,
        oldModules: oldModules.length
      };
      
    } catch (error) {
      console.error('❌ Errore verifica stato:', error);
      throw error;
    }
  },

  // Utility per aggiungere nuovi moduli senza cancellare progressi
  async addNewModules() {
    console.log('🔄 Aggiunta nuovi moduli...');
    
    try {
      const result = await AddNewModules.addMissingModules();
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        if (result.added > 0) {
          console.log(`📦 Moduli aggiunti: ${result.added}`);
          result.modules.forEach(m => {
            console.log(`   - ${m.code}: ${m.title}`);
          });
          
          // Ricarica l'applicazione per mostrare i nuovi moduli
          console.log('🔄 Ricarico applicazione...');
          location.reload();
        } else {
          console.log('ℹ️ Nessun nuovo modulo da aggiungere');
        }
      } else {
        console.error(`❌ ${result.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Errore aggiunta nuovi moduli:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Utility per verificare moduli mancanti
  async checkMissingModules() {
    console.log('🔍 Verifica moduli mancanti...');
    
    try {
      const result = await AddNewModules.addMissingModules();
      
      if (result.success) {
        console.log(`📊 ${result.message}`);
        console.log(`📦 Moduli da aggiungere: ${result.added}`);
        
        if (result.added > 0) {
          console.log('\n📋 Moduli mancanti:');
          result.modules.forEach(m => {
            console.log(`   - ${m.code}: ${m.title}`);
          });
        } else {
          console.log('✅ Tutti i moduli sono presenti nel database');
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Errore verifica moduli mancanti:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Utility per fissare dipendenze mancanti
  async fixMissingDependencies() {
    console.log('🔧 Fissaggio dipendenze mancanti...');
    
    try {
      const result = await AddNewModules.fixMissingDependencies();
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        if (result.fixed > 0) {
          console.log(`🔗 Dipendenze fissate: ${result.fixed}`);
          if (result.errors > 0) {
            console.log(`⚠️ Errori durante il fissaggio: ${result.errors}`);
          }
          
          // Ricarica l'applicazione per mostrare le nuove dipendenze nel grafo
          console.log('🔄 Ricarico applicazione per mostrare le dipendenze...');
          location.reload();
        } else {
          console.log('ℹ️ Nessuna dipendenza mancante da fissare');
        }
      } else {
        console.error(`❌ ${result.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Errore fissaggio dipendenze:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// Avvia applicazione quando DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

