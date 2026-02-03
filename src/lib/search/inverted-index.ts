/**
 * Inverted index implementation for fast text search.
 *
 * The inverted index maps terms to documents containing them,
 * enabling O(1) term lookup instead of O(n) document scanning.
 *
 * Key features:
 * - Separate indices per field (suchtext, fotografen, bildnummer)
 * - Term frequencies tracked for BM25 scoring
 * - Document lengths tracked for BM25 normalization
 * - Lookup tables for filter dropdowns
 */

import type { ProcessedMediaItem } from '@/lib/data/types';
import type { Posting, FieldIndex } from './types';
import { tokenize } from './tokenizer';
import { normalizeGerman } from '@/lib/data/preprocess';

/**
 * InvertedIndex class manages document indexing and term lookup.
 *
 * Usage:
 * 1. Create instance: const index = new InvertedIndex()
 * 2. Add documents: index.addDocument(docId, item)
 * 3. Finalize: index.finalizeIndex() (calculates avgDocLength)
 * 4. Query: index.getPostings('berlin', 'suchtext')
 */
export class InvertedIndex {
  /** Index for the searchableText field */
  private suchtextIndex: FieldIndex;

  /** Index for the fotografen field */
  private fotografenIndex: FieldIndex;

  /** Index for the bildnummer field */
  private bildnummerIndex: FieldIndex;

  /** Array of all documents, indexed by docId */
  private documents: ProcessedMediaItem[];

  /** Distinct photographers for filter dropdown */
  private photographers: Set<string>;

  /** Distinct restrictions for filter dropdown */
  private restrictions: Set<string>;

  /** Sorted term list for suchtext prefix lookup */
  private suchtextTermsSorted: string[] = [];

  /** Sorted term list for fotografen prefix lookup */
  private fotografenTermsSorted: string[] = [];

  /** Sorted term list for bildnummer prefix lookup */
  private bildnummerTermsSorted: string[] = [];

  constructor() {
    this.suchtextIndex = this.createEmptyFieldIndex();
    this.fotografenIndex = this.createEmptyFieldIndex();
    this.bildnummerIndex = this.createEmptyFieldIndex();
    this.documents = [];
    this.photographers = new Set();
    this.restrictions = new Set();
  }

  /**
   * Create an empty field index structure.
   */
  private createEmptyFieldIndex = (): FieldIndex => {
    return {
      termPostings: new Map(),
      docLengths: new Map(),
      totalDocs: 0,
      avgDocLength: 0,
    };
  };

  /**
   * Add a document to the index.
   *
   * Indexes the document in both suchtext and fotografen indices,
   * and populates the lookup tables for filters.
   *
   * Note: Uses the RAW suchtext (minus restrictions) and fotografen fields
   * for tokenization, NOT the pre-normalized fields. This ensures normalization
   * happens exactly once (during tokenize).
   *
   * @param docId - Unique document ID (typically array index)
   * @param item - Processed media item to index
   */
  addDocument = (docId: number, item: ProcessedMediaItem): void => {
    // Store document reference
    this.documents[docId] = item;

    // Index RAW suchtext (minus restrictions) - tokenize will normalize
    // We can't use item.searchableText because it's already normalized,
    // and tokenize would double-normalize it.
    // We need to extract the clean text from suchtext (without restrictions)
    const cleanSuchtext = this.extractCleanSuchtext(item.suchtext);
    const suchtextTokens = tokenize(cleanSuchtext);
    this.indexTokens(this.suchtextIndex, docId, suchtextTokens);

    // Index RAW fotografen - tokenize will normalize
    const fotografenTokens = tokenize(item.fotografen);
    this.indexTokens(this.fotografenIndex, docId, fotografenTokens);

    // Index bildnummer - tokenize will normalize (handles UUID format)
    const bildnummerTokens = tokenize(item.bildnummer);
    this.indexTokens(this.bildnummerIndex, docId, bildnummerTokens);

    // Populate lookup tables
    this.photographers.add(item.fotografen);
    for (const restriction of item.restrictions) {
      this.restrictions.add(restriction);
    }
  };

  /**
   * Extract clean text from suchtext by removing restriction tokens.
   * Uses the same pattern as extractRestrictions from preprocess.ts.
   */
  private extractCleanSuchtext = (suchtext: string): string => {
    if (!suchtext) return '';
    // Remove restriction tokens (uppercase words joined by 'x')
    return suchtext
      .replace(/[A-Z]+(?:x[A-Z]+)+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  /**
   * Index tokens for a document in a specific field index.
   *
   * Counts term frequencies and updates the index structure.
   *
   * @param index - Field index to update
   * @param docId - Document ID
   * @param tokens - Array of tokens from the document
   */
  private indexTokens = (
    index: FieldIndex,
    docId: number,
    tokens: string[]
  ): void => {
    // Count term frequencies for this document
    const termFreqs = new Map<string, number>();
    for (const token of tokens) {
      termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
    }

    // Update term postings
    for (const [term, freq] of termFreqs) {
      const posting: Posting = { docId, termFrequency: freq };

      const existingPostings = index.termPostings.get(term);
      if (existingPostings) {
        existingPostings.push(posting);
      } else {
        index.termPostings.set(term, [posting]);
      }
    }

    // Update document length (total tokens in this field)
    index.docLengths.set(docId, tokens.length);

    // Increment document count
    index.totalDocs++;
  };

  /**
   * Finalize the index after all documents have been added.
   *
   * Calculates average document lengths needed for BM25 scoring
   * and builds sorted term lists for prefix matching.
   * Must be called before performing searches.
   */
  finalizeIndex = (): void => {
    // Calculate average document lengths for BM25
    this.suchtextIndex.avgDocLength = this.calculateAvgDocLength(
      this.suchtextIndex
    );
    this.fotografenIndex.avgDocLength = this.calculateAvgDocLength(
      this.fotografenIndex
    );
    this.bildnummerIndex.avgDocLength = this.calculateAvgDocLength(
      this.bildnummerIndex
    );

    // Build sorted term lists for prefix matching
    this.suchtextTermsSorted = Array.from(
      this.suchtextIndex.termPostings.keys()
    ).sort();
    this.fotografenTermsSorted = Array.from(
      this.fotografenIndex.termPostings.keys()
    ).sort();
    this.bildnummerTermsSorted = Array.from(
      this.bildnummerIndex.termPostings.keys()
    ).sort();
  };

  /**
   * Calculate average document length for a field index.
   */
  private calculateAvgDocLength = (index: FieldIndex): number => {
    if (index.totalDocs === 0) return 0;

    let totalLength = 0;
    for (const length of index.docLengths.values()) {
      totalLength += length;
    }
    return totalLength / index.totalDocs;
  };

  /**
   * Get postings for a term in a specific field.
   *
   * The term is normalized before lookup to ensure consistent matching.
   *
   * @param term - Search term (will be normalized)
   * @param field - Field to search ('suchtext', 'fotografen', or 'bildnummer')
   * @returns Array of postings (docId + termFrequency), empty if term not found
   */
  getPostings = (term: string, field: 'suchtext' | 'fotografen' | 'bildnummer'): Posting[] => {
    // Normalize the term to match indexed terms
    const normalizedTerm = normalizeGerman(term).toLowerCase();

    const index = this.getFieldIndex(field);
    return index.termPostings.get(normalizedTerm) || [];
  };

  /**
   * Get a document by its ID.
   *
   * @param docId - Document ID
   * @returns The document, or undefined if not found
   */
  getDocument = (docId: number): ProcessedMediaItem | undefined => {
    return this.documents[docId];
  };

  /**
   * Get all documents in the index.
   *
   * Useful for operations that need to scan all documents
   * (e.g., date range filtering when no text query is provided).
   *
   * @returns Array of all documents
   */
  getAllDocuments = (): ProcessedMediaItem[] => {
    return this.documents;
  };

  /**
   * Get distinct photographers for filter dropdown.
   *
   * Returns the original fotografen values (not normalized),
   * sorted alphabetically.
   *
   * @returns Sorted array of distinct photographer names
   */
  getPhotographers = (): string[] => {
    return Array.from(this.photographers).sort();
  };

  /**
   * Get distinct restrictions for filter dropdown.
   *
   * Returns the original restriction tokens (e.g., PUBLICATIONxINxGERxONLY),
   * sorted alphabetically.
   *
   * @returns Sorted array of distinct restriction tokens
   */
  getRestrictions = (): string[] => {
    return Array.from(this.restrictions).sort();
  };

  /**
   * Get the field index for direct access (needed for BM25 scoring).
   *
   * @param field - Field name
   * @returns The FieldIndex structure
   */
  getFieldIndex = (field: 'suchtext' | 'fotografen' | 'bildnummer'): FieldIndex => {
    switch (field) {
      case 'suchtext':
        return this.suchtextIndex;
      case 'fotografen':
        return this.fotografenIndex;
      case 'bildnummer':
        return this.bildnummerIndex;
    }
  };

  /**
   * Get all terms starting with a prefix.
   *
   * Uses binary search to find the first term >= prefix, then collects
   * all terms that start with the prefix up to the limit.
   *
   * Time complexity: O(log n + k) where n is vocab size, k is result count.
   *
   * @param prefix - Prefix to search for (should be normalized)
   * @param field - Field to search in
   * @param limit - Maximum terms to return (default 50)
   * @returns Array of terms starting with prefix
   *
   * @example
   * index.getPrefixTerms('ber', 'suchtext', 10)
   * // ['berg', 'berlin', 'beruf', ...]
   */
  getPrefixTerms = (
    prefix: string,
    field: 'suchtext' | 'fotografen' | 'bildnummer',
    limit: number = 50
  ): string[] => {
    let terms: string[];
    switch (field) {
      case 'suchtext':
        terms = this.suchtextTermsSorted;
        break;
      case 'fotografen':
        terms = this.fotografenTermsSorted;
        break;
      case 'bildnummer':
        terms = this.bildnummerTermsSorted;
        break;
    }

    if (terms.length === 0 || !prefix) {
      return [];
    }

    // Binary search for first term >= prefix
    let lo = 0;
    let hi = terms.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (terms[mid] < prefix) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    // Collect matching terms up to limit
    const matches: string[] = [];
    for (let i = lo; i < terms.length && matches.length < limit; i++) {
      if (terms[i].startsWith(prefix)) {
        matches.push(terms[i]);
      } else {
        // Past prefix range, stop iterating
        break;
      }
    }

    return matches;
  };

  /**
   * Get index statistics for debugging.
   *
   * @returns Object with total docs, term counts per field
   */
  getStats = (): {
    totalDocs: number;
    suchtextTerms: number;
    fotografenTerms: number;
    bildnummerTerms: number;
    suchtextAvgLength: number;
    fotografenAvgLength: number;
    bildnummerAvgLength: number;
    photographerCount: number;
    restrictionCount: number;
  } => {
    return {
      totalDocs: this.documents.length,
      suchtextTerms: this.suchtextIndex.termPostings.size,
      fotografenTerms: this.fotografenIndex.termPostings.size,
      bildnummerTerms: this.bildnummerIndex.termPostings.size,
      suchtextAvgLength: this.suchtextIndex.avgDocLength,
      fotografenAvgLength: this.fotografenIndex.avgDocLength,
      bildnummerAvgLength: this.bildnummerIndex.avgDocLength,
      photographerCount: this.photographers.size,
      restrictionCount: this.restrictions.size,
    };
  };
}
