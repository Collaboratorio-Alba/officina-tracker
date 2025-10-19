/**
 * Validators
 * Funzioni di validazione per dati del sistema
 */

/**
 * Valida dati modulo
 * @param {Object} moduleData - Dati del modulo da validare
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateModule(moduleData) {
  const errors = [];
  
  // Campi obbligatori
  if (!moduleData.title || moduleData.title.trim() === '') {
    errors.push('Titolo obbligatorio');
  }
  
  if (!moduleData.code || moduleData.code.trim() === '') {
    errors.push('Codice obbligatorio');
  }
  
  // Validazione lunghezze
  if (moduleData.title && moduleData.title.length > 200) {
    errors.push('Titolo troppo lungo (max 200 caratteri)');
  }
  
  if (moduleData.code && moduleData.code.length > 50) {
    errors.push('Codice troppo lungo (max 50 caratteri)');
  }
  
  // Validazione tipo
  const validTypes = ['online', 'presenza'];
  if (moduleData.type && !validTypes.includes(moduleData.type)) {
    errors.push('Tipo non valido (deve essere "online" o "presenza")');
  }
  
  // Validazione difficoltà
  const validDifficulties = ['base', 'intermedio', 'avanzato'];
  if (moduleData.difficulty && !validDifficulties.includes(moduleData.difficulty)) {
    errors.push('Difficoltà non valida');
  }
  
  // Validazione durata
  if (moduleData.estimatedDuration !== undefined) {
    const duration = parseInt(moduleData.estimatedDuration);
    if (isNaN(duration) || duration < 0 || duration > 1440) {
      errors.push('Durata non valida (0-1440 minuti)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida stato progresso
 * @param {string} status - Stato da validare
 * @returns {boolean}
 */
export function validateProgressStatus(status) {
  const validStatuses = ['not-started', 'in-progress', 'completed', 'failed'];
  return validStatuses.includes(status);
}

/**
 * Valida score di valutazione
 * @param {number} score - Score da validare (0-100)
 * @returns {boolean}
 */
export function validateAssessmentScore(score) {
  return typeof score === 'number' && score >= 0 && score <= 100;
}

/**
 * Valida tipo dipendenza
 * @param {string} type - Tipo da validare
 * @returns {boolean}
 */
export function validateDependencyType(type) {
  const validTypes = ['mandatory', 'recommended'];
  return validTypes.includes(type);
}

/**
 * Sanitizza input utente
 * @param {string} input - Input da sanitizzare
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Rimuovi < >
    .substring(0, 1000);  // Limita lunghezza
}

/**
 * Valida email (opzionale per future funzionalità)
 * @param {string} email - Email da validare
 * @returns {boolean}
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valida URL
 * @param {string} url - URL da validare
 * @returns {boolean}
 */
export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

