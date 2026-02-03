/**
 * Search orchestration module.
 *
 * Coordinates query processing, BM25 scoring across multiple fields,
 * prefix matching, and result ranking.
 *
 * Design:
 * - Pure function that accepts index as parameter (avoids circular imports)
 * - IDF caching for performance
 * - Field-weighted scoring (suchtext > fotografen)
 * - Prefix expansion with penalty for non-exact matches
 */

import type { InvertedIndex } from './inverted-index';
import type {
  ProcessedMediaItem,
  FieldIndex,
  SearchResult,
  SearchConfig,
} from './types';
import { DEFAULT_SEARCH_CONFIG } from './types';
import { tokenize } from './tokenizer';
import { computeIDF, computeTermScore } from './bm25';

/**
 * IDF cache to avoid recomputation.
 * Structure: Map<field, Map<term, idf>>
 *
 * IDF only depends on corpus statistics, so we can cache it
 * after first computation for each term.
 */
const idfCache = new Map<string, Map<string, number>>();

/**
 * Get or compute IDF for a term in a field.
 *
 * Uses cache to avoid recomputation since IDF is corpus-dependent,
 * not query-dependent.
 *
 * @param term - Normalized search term
 * @param field - Field to compute IDF for
 * @param fieldIndex - Field index with corpus statistics
 * @returns IDF value for the term
 */
const getIDF = (
  term: string,
  field: 'suchtext' | 'fotografen' | 'bildnummer',
  fieldIndex: FieldIndex
): number => {
  // Get or create field cache
  let fieldCache = idfCache.get(field);
  if (!fieldCache) {
    fieldCache = new Map();
    idfCache.set(field, fieldCache);
  }

  // Check cache
  const cached = fieldCache.get(term);
  if (cached !== undefined) {
    return cached;
  }

  // Compute IDF
  const postings = fieldIndex.termPostings.get(term);
  const docFreq = postings ? postings.length : 0;
  const idf = computeIDF(docFreq, fieldIndex.totalDocs);

  // Cache and return
  fieldCache.set(term, idf);
  return idf;
};

/**
 * Internal structure for accumulating document scores.
 */
interface DocScoreEntry {
  score: number;
  terms: Set<string>;
}

/**
 * Score a term (exact or prefix-expanded) in a specific field.
 *
 * Computes BM25 score for each document containing the term and
 * accumulates into the docScores map.
 *
 * @param term - Term to score (already normalized)
 * @param field - Field to search
 * @param index - Inverted index
 * @param docScores - Map to accumulate scores into
 * @param config - Search configuration
 * @param isPrefix - Whether this is a prefix-expanded term (applies penalty)
 */
const scoreTermInField = (
  term: string,
  field: 'suchtext' | 'fotografen' | 'bildnummer',
  index: InvertedIndex,
  docScores: Map<number, DocScoreEntry>,
  config: SearchConfig,
  isPrefix: boolean
): void => {
  const fieldIndex = index.getFieldIndex(field);
  const postings = fieldIndex.termPostings.get(term);

  if (!postings || postings.length === 0) {
    return;
  }

  // Get IDF for this term
  const idf = getIDF(term, field, fieldIndex);

  // Determine field weight
  let fieldWeight: number;
  switch (field) {
    case 'suchtext':
      fieldWeight = config.suchtextWeight;
      break;
    case 'fotografen':
      fieldWeight = config.fotografenWeight;
      break;
    case 'bildnummer':
      fieldWeight = config.bildnummerWeight;
      break;
  }

  // Apply prefix penalty if needed
  const prefixMultiplier = isPrefix ? config.prefixPenalty : 1.0;

  // BM25 config
  const bm25Config = { k1: config.k1, b: config.b };

  // Score each document containing this term
  for (const posting of postings) {
    const { docId, termFrequency } = posting;
    const docLength = fieldIndex.docLengths.get(docId) || 0;

    // Compute BM25 term score
    const rawScore = computeTermScore(
      termFrequency,
      docLength,
      fieldIndex.avgDocLength,
      idf,
      bm25Config
    );

    // Apply field weight and prefix penalty
    const finalScore = rawScore * fieldWeight * prefixMultiplier;

    // Accumulate into docScores
    const existing = docScores.get(docId);
    if (existing) {
      existing.score += finalScore;
      existing.terms.add(term);
    } else {
      docScores.set(docId, {
        score: finalScore,
        terms: new Set([term]),
      });
    }
  }
};

/**
 * Execute a search query against the inverted index.
 *
 * Processing pipeline:
 * 1. Tokenize query (same normalization as index)
 * 2. For each query term:
 *    a. Score exact matches in both fields
 *    b. Expand prefix and score expanded terms (with penalty)
 * 3. Rank results by BM25 score
 * 4. Tie-breaker: newest documents first
 *
 * @param query - User query string
 * @param index - Inverted index to search
 * @param config - Search configuration (optional, uses defaults)
 * @returns Array of search results, sorted by relevance
 *
 * @example
 * // Basic search
 * const results = search('berlin', index);
 *
 * @example
 * // Multi-word OR search
 * const results = search('berlin muenchen', index);
 *
 * @example
 * // With custom config
 * const results = search('foto', index, { suchtextWeight: 2.0 });
 */
export const search = (
  query: string,
  index: InvertedIndex,
  config?: Partial<SearchConfig>
): SearchResult[] => {
  // Merge config with defaults
  const cfg: SearchConfig = { ...DEFAULT_SEARCH_CONFIG, ...config };

  // Tokenize query (same normalization as index)
  const queryTerms = tokenize(query);

  // Handle empty query: return all documents with score 0
  if (queryTerms.length === 0) {
    return index.getAllDocuments().map((item, docId) => ({
      docId,
      item,
      score: 0,
      matchedTerms: [],
    }));
  }

  // Accumulate document scores
  const docScores = new Map<number, DocScoreEntry>();

  // Process each query term
  for (const term of queryTerms) {
    // Score exact matches in all fields
    scoreTermInField(term, 'suchtext', index, docScores, cfg, false);
    scoreTermInField(term, 'fotografen', index, docScores, cfg, false);
    scoreTermInField(term, 'bildnummer', index, docScores, cfg, false);

    // Prefix expansion for terms >= minPrefixLength
    if (term.length >= cfg.minPrefixLength) {
      // Get prefix-expanded terms from all fields
      const suchtextPrefixTerms = index.getPrefixTerms(
        term,
        'suchtext',
        cfg.maxPrefixExpansion
      );
      const fotografenPrefixTerms = index.getPrefixTerms(
        term,
        'fotografen',
        cfg.maxPrefixExpansion
      );
      const bildnummerPrefixTerms = index.getPrefixTerms(
        term,
        'bildnummer',
        cfg.maxPrefixExpansion
      );

      // Score prefix-expanded terms in suchtext
      for (const prefixTerm of suchtextPrefixTerms) {
        // Skip if same as exact term (already scored)
        if (prefixTerm === term) continue;
        scoreTermInField(prefixTerm, 'suchtext', index, docScores, cfg, true);
      }

      // Score prefix-expanded terms in fotografen
      for (const prefixTerm of fotografenPrefixTerms) {
        if (prefixTerm === term) continue;
        scoreTermInField(prefixTerm, 'fotografen', index, docScores, cfg, true);
      }

      // Score prefix-expanded terms in bildnummer
      for (const prefixTerm of bildnummerPrefixTerms) {
        if (prefixTerm === term) continue;
        scoreTermInField(prefixTerm, 'bildnummer', index, docScores, cfg, true);
      }
    }
  }

  // Convert to SearchResult array
  const results: SearchResult[] = [];
  for (const [docId, entry] of docScores) {
    const item = index.getDocument(docId);
    if (item) {
      results.push({
        docId,
        item,
        score: entry.score,
        matchedTerms: Array.from(entry.terms),
      });
    }
  }

  // Sort by score (descending), then by date (newest first as tie-breaker)
  results.sort((a, b) => {
    // Primary: score descending
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tie-breaker: newest first (dateISO is ISO format, string compare works)
    return b.item.dateISO.localeCompare(a.item.dateISO);
  });

  return results;
};
