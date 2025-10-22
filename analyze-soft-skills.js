/**
 * Analisi delle soft skills mancanti nel curriculum ciclofficina
 */

import fs from 'fs';

// Carica tutti i file di livello per analisi completa
const levelFiles = [
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
  'ciclofficina_level11.json'
];

console.log('🔍 ANALISI SOFT SKILLS MANCANTI NEL CURRICULUM');
console.log('==============================================\n');

let allModules = [];
let softSkillsModules = [];

// Analizza tutti i moduli
for (const levelFile of levelFiles) {
  try {
    const levelData = JSON.parse(fs.readFileSync(`./js/data/${levelFile}`, 'utf8'));
    
    let modules = [];
    
    // Gestione struttura diversa per livello 1 vs altri livelli
    if (levelFile === 'ciclofficina_level1.json' && levelData.courses) {
      // Struttura livello 1 (contenente corso completo)
      const course = levelData.courses[0];
      if (course && course.teachingAreas) {
        modules = course.teachingAreas[0].modules || [];
      }
    } else if (levelData.modules) {
      // Struttura altri livelli (modules diretti)
      modules = levelData.modules || [];
    }
    
    allModules.push(...modules);
    
    // Identifica moduli che potrebbero essere soft skills
    modules.forEach(module => {
      const title = module.title.toLowerCase();
      const description = module.description.toLowerCase();
      
      // Criteri per identificare soft skills
      const softSkillKeywords = [
        'comunicazione', 'documentazione', 'diagnosi', 'valutazione', 'organizzazione',
        'pianificazione', 'sicurezza', 'metodologia', 'classificazione', 'registro',
        'checklist', 'priorità', 'delega', 'costi', 'stima', 'collaudo', 'collaborativo',
        'comunità', 'certificazione', 'economia', 'sostenibilità', 'ergonomia'
      ];
      
      const isSoftSkill = softSkillKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
      
      if (isSoftSkill) {
        softSkillsModules.push({
          id: module.id,
          title: module.title,
          levelFile: levelFile,
          description: module.description
        });
      }
    });
    
  } catch (error) {
    console.warn(`⚠️ Errore caricamento ${levelFile}:`, error.message);
  }
}

// Analisi delle soft skills esistenti
console.log('📊 SOFT SKILLS ESISTENTI NEL CURRICULUM:');
console.log('========================================');
softSkillsModules.forEach(module => {
  console.log(`   - ${module.id}: ${module.title}`);
  console.log(`     File: ${module.levelFile}`);
});

// Identificazione soft skills mancanti
console.log('\n🎯 SOFT SKILLS MANCANTI DA CONSIDERARE:');
console.log('======================================');

const missingSoftSkills = [
  {
    id: 'BIKE-1.5.2',
    title: 'Comunicazione efficace con clienti e colleghi',
    description: 'Tecniche di ascolto attivo, spiegazione problemi tecnici in linguaggio semplice, gestione aspettative',
    rationale: 'Fondamentale per officine popolari che lavorano con comunità diverse'
  },
  {
    id: 'BIKE-1.5.3', 
    title: 'Gestione inventario e magazzino parti di ricambio',
    description: 'Sistemi semplici per tracciare ricambi, organizzazione spazi, gestione scorte minime',
    rationale: 'Competenza organizzativa cruciale per officine autogestite'
  },
  {
    id: 'BIKE-1.5.4',
    title: 'Sicurezza in officina e prevenzione infortuni',
    description: 'Procedure base di sicurezza, DPI, organizzazione spazi di lavoro, gestione prodotti chimici',
    rationale: 'Competenza trasversale essenziale per tutti i livelli'
  },
  {
    id: 'BIKE-1.5.5',
    title: 'Problem solving sistematico per guasti complessi',
    description: 'Metodologia per analisi problemi, diagnosi differenziale, approccio step-by-step',
    rationale: 'Competenza diagnostica avanzata oltre la semplice riparazione'
  },
  {
    id: 'BIKE-1.5.6',
    title: 'Gestione progetti di restauro e personalizzazione',
    description: 'Pianificazione fasi, stima tempi/costi, gestione aspettative, documentazione progressi',
    rationale: 'Per progetti complessi di restauro o personalizzazione bici'
  },
  {
    id: 'BIKE-1.5.7',
    title: 'Didattica e trasmissione conoscenze in ciclofficina',
    description: 'Tecniche insegnamento pratico, mentoring, creazione materiali didattici semplici',
    rationale: 'Per chi vuole insegnare ad altri nelle officine popolari'
  },
  {
    id: 'BIKE-1.5.8',
    title: 'Sostenibilità e economia circolare in ciclofficina',
    description: 'Riciclo componenti, riparazione vs sostituzione, scelta materiali sostenibili',
    rationale: 'Allineamento con principi economia circolare delle officine popolari'
  },
  {
    id: 'BIKE-1.5.9',
    title: 'Gestione digitale: foto, schede, archiviazione lavori',
    description: 'Uso smartphone per documentazione, creazione schede digitali, archiviazione foto prima/dopo',
    rationale: 'Competenza digitale per modernizzare le officine tradizionali'
  }
];

missingSoftSkills.forEach(skill => {
  console.log(`\n🔹 ${skill.id}: ${skill.title}`);
  console.log(`   Descrizione: ${skill.description}`);
  console.log(`   Motivazione: ${skill.rationale}`);
});

// Analisi gap specifici
console.log('\n📈 ANALISI GAP SPECIFICI:');
console.log('========================');

const gapAnalysis = {
  'Comunicazione': {
    current: softSkillsModules.filter(m => m.title.toLowerCase().includes('comunicazione')).length,
    needed: 2,
    priority: 'Alta'
  },
  'Organizzazione': {
    current: softSkillsModules.filter(m => m.title.toLowerCase().includes('organizzazione') || m.title.toLowerCase().includes('registro')).length,
    needed: 3,
    priority: 'Alta'
  },
  'Sicurezza': {
    current: softSkillsModules.filter(m => m.title.toLowerCase().includes('sicurezza')).length,
    needed: 2,
    priority: 'Alta'
  },
  'Economia/Sostenibilità': {
    current: softSkillsModules.filter(m => m.title.toLowerCase().includes('economia') || m.title.toLowerCase().includes('sostenibilità')).length,
    needed: 2,
    priority: 'Media'
  },
  'Didattica/Mentoring': {
    current: softSkillsModules.filter(m => m.title.toLowerCase().includes('didattica') || m.title.toLowerCase().includes('comunità')).length,
    needed: 1,
    priority: 'Media'
  },
  'Digitale/Tecnologia': {
    current: softSkillsModules.filter(m => m.title.toLowerCase().includes('digitale') || m.title.toLowerCase().includes('foto')).length,
    needed: 1,
    priority: 'Bassa'
  }
};

Object.entries(gapAnalysis).forEach(([area, data]) => {
  const status = data.current >= data.needed ? '✅' : '❌';
  console.log(`${status} ${area}: ${data.current}/${data.needed} (Priorità: ${data.priority})`);
});

console.log('\n💡 RACCOMANDAZIONI:');
console.log('=================');
console.log('1. PRIORITÀ ALTA: Comunicazione, Organizzazione, Sicurezza');
console.log('2. PRIORITÀ MEDIA: Economia circolare, Didattica');
console.log('3. PRIORITÀ BASSA: Competenze digitali avanzate');
console.log('4. CONSIDERARE: Integrazione soft skills nei moduli tecnici esistenti');