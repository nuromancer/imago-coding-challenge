/**
 * BM25 scoring implementation.
 *
 * BM25 (Best Matching 25) is an industry-standard ranking function used by
 * Elasticsearch, Lucene, and most modern search systems. It improves upon
 * TF-IDF by adding term frequency saturation and document length normalization.
 *
 * This implementation uses the Lucene/Elasticsearch variant of the IDF formula
 * which is always non-negative.
 *
 * Standard parameters: k1=1.2, b=0.75
 *
 * @see https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables
 */

/**
 * Configuration for BM25 scoring parameters.
 */
export interface BM25Config {
  /**
   * k1: Term frequency saturation parameter.
   * Controls how quickly TF saturates (higher = slower saturation).
   * Standard value: 1.2
   * Range: typically 1.2 - 2.0
   */
  k1: number;

  /**
   * b: Document length normalization parameter.
   * Controls impact of document length (0 = no normalization, 1 = full).
   * Standard value: 0.75
   * Range: 0 - 1
   */
  b: number;
}

/**
 * Default BM25 configuration using industry-standard values.
 */
export const DEFAULT_BM25_CONFIG: BM25Config = {
  k1: 1.2,
  b: 0.75,
};

/**
 * Compute Inverse Document Frequency (IDF) for a term.
 *
 * Uses the Lucene/Elasticsearch variant of BM25 IDF:
 *   IDF = ln(1 + (N - n + 0.5) / (n + 0.5))
 *
 * Where:
 * - N = total documents in corpus
 * - n = documents containing the term
 *
 * This formula is always non-negative (unlike classic IDF which can be
 * negative for terms appearing in >50% of documents).
 *
 * @param docFreq - Number of documents containing the term (n)
 * @param totalDocs - Total documents in the corpus (N)
 * @returns IDF value (always >= 0)
 *
 * @example
 * // Rare term (high IDF)
 * computeIDF(100, 10000) // ~4.6
 *
 * @example
 * // Common term (low IDF)
 * computeIDF(5000, 10000) // ~0.29
 */
export const computeIDF = (docFreq: number, totalDocs: number): number => {
  // Guard against edge cases
  if (totalDocs === 0 || docFreq === 0) {
    return 0;
  }

  return Math.log(1 + (totalDocs - docFreq + 0.5) / (docFreq + 0.5));
};

/**
 * Compute BM25 term score for a single term match in a document.
 *
 * Formula:
 *   score = IDF * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgDocLen)))
 *
 * The score combines:
 * - IDF: How rare/discriminative the term is
 * - TF saturation: Diminishing returns for repeated term occurrences
 * - Length normalization: Penalize long documents that match just by size
 *
 * @param tf - Term frequency in this document
 * @param docLength - Number of tokens in the document field
 * @param avgDocLength - Average tokens across all documents in field
 * @param idf - Pre-computed IDF for this term
 * @param config - BM25 parameters (k1, b)
 * @returns BM25 term score (always >= 0)
 *
 * @example
 * // Typical usage
 * const idf = computeIDF(100, 10000);
 * computeTermScore(2, 10, 8, idf) // ~6.5
 */
export const computeTermScore = (
  tf: number,
  docLength: number,
  avgDocLength: number,
  idf: number,
  config: BM25Config = DEFAULT_BM25_CONFIG
): number => {
  // Guard against edge cases
  if (avgDocLength === 0 || tf === 0) {
    return 0;
  }

  const { k1, b } = config;

  // Document length normalization factor
  // 1.0 when docLength equals avgDocLength
  // > 1.0 for longer documents (penalizes)
  // < 1.0 for shorter documents (boosts)
  const lengthNorm = 1 - b + b * (docLength / avgDocLength);

  // Term frequency saturation with length normalization
  // Higher TF gives diminishing returns (saturates towards k1+1)
  const tfSaturated = (tf * (k1 + 1)) / (tf + k1 * lengthNorm);

  return idf * tfSaturated;
};
