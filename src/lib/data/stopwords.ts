/**
 * German stopwords for search filtering.
 *
 * Uses stopwords-de package as base, exported as Set for O(1) lookup.
 * We use a minimal subset (~50 core function words) rather than the full 750+
 * to avoid over-filtering media metadata.
 */

// Import the full list from the package
import stopwordsDe from 'stopwords-de';

/**
 * Minimal German stopwords - core function words only.
 * These are words that provide no search value in media metadata context.
 */
const MINIMAL_STOPWORDS = [
  // Articles
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einer', 'einem', 'einen', 'eines',

  // Prepositions
  'in', 'im', 'an', 'am', 'auf', 'aus', 'bei', 'mit', 'nach', 'von', 'vor', 'zu', 'zum', 'zur',
  'durch', 'fuer', 'gegen', 'ohne', 'um', 'unter', 'ueber',

  // Conjunctions
  'und', 'oder', 'aber', 'denn', 'weil', 'wenn', 'als', 'ob', 'dass',

  // Pronouns
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
  'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
  'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes',
  'welcher', 'welche', 'welches',

  // Auxiliaries and common verbs
  'ist', 'sind', 'war', 'waren', 'wird', 'werden', 'hat', 'haben', 'hatte', 'hatten',
  'kann', 'koennen', 'muss', 'muessen', 'soll', 'sollen', 'will', 'wollen',

  // Other function words
  'nicht', 'auch', 'nur', 'noch', 'schon', 'sehr', 'so', 'wie', 'was', 'wer',
  'hier', 'dort', 'dann', 'daher', 'dabei', 'dazu',

  // Domain-specific additions
  'imago', // Always appears in fotografen field, not useful for search
];

/**
 * German stopwords as a Set for O(1) lookup during tokenization.
 * Includes both the minimal set and normalized versions (umlauts converted).
 */
export const GERMAN_STOPWORDS: Set<string> = new Set([
  ...MINIMAL_STOPWORDS,
  // Add normalized versions (ae/oe/ue/ss) for matching after umlaut conversion
  ...MINIMAL_STOPWORDS.map(w =>
    w.replace(/ä/g, 'ae')
     .replace(/ö/g, 'oe')
     .replace(/ü/g, 'ue')
     .replace(/ß/g, 'ss')
  ),
]);

/**
 * Full stopwords list from stopwords-de package.
 * Available if needed for more aggressive filtering.
 */
export const FULL_GERMAN_STOPWORDS: Set<string> = new Set(stopwordsDe);
