#!/usr/bin/env npx tsx
/**
 * CLI script to generate 10,000 preprocessed media items.
 *
 * Usage: npm run generate-data
 *
 * This script:
 * 1. Seeds Faker for reproducibility (same seed = same output)
 * 2. Generates 10k raw media items with realistic German content
 * 3. Preprocesses each item (date normalization, umlaut conversion, restriction extraction)
 * 4. Writes to data/media-items.json
 *
 * The output file contains ProcessedMediaItem objects ready for search indexing.
 */

import { fakerDE } from '@faker-js/faker';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { generateRawItem } from '../src/lib/data/generate';
import { preprocessItem } from '../src/lib/data/preprocess';
import type { ProcessedMediaItem } from '../src/lib/data/types';

// Configuration
const SEED = 42;
const REFERENCE_DATE = new Date('2024-06-15');
const ITEM_COUNT = 10_000;
const OUTPUT_FILE = 'data/media-items.json';

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const outputPath = join(projectRoot, OUTPUT_FILE);

console.log('='.repeat(60));
console.log('IMAGO Media Item Generator');
console.log('='.repeat(60));
console.log(`Seed: ${SEED}`);
console.log(`Reference date: ${REFERENCE_DATE.toISOString().split('T')[0]}`);
console.log(`Target count: ${ITEM_COUNT.toLocaleString()} items`);
console.log(`Output: ${OUTPUT_FILE}`);
console.log('='.repeat(60));

// Set seed and reference date for reproducibility
fakerDE.seed(SEED);
fakerDE.setDefaultRefDate(REFERENCE_DATE);

const startTime = Date.now();
console.log(`\nStarted at: ${new Date().toISOString()}`);

// Generate raw items
console.log('\nGenerating raw items...');
const rawItems = fakerDE.helpers.multiple(generateRawItem, { count: ITEM_COUNT });

// Preprocess items
console.log('Preprocessing items...');
const processedItems: ProcessedMediaItem[] = [];
let skippedCount = 0;
let dirtyDateCount = 0;
let restrictionCount = 0;

for (const raw of rawItems) {
  try {
    const processed = preprocessItem(raw);
    processedItems.push(processed);

    // Track statistics
    if (raw.datum !== processed.dateISO) {
      dirtyDateCount++;
    }
    if (processed.restrictions.length > 0) {
      restrictionCount++;
    }
  } catch (error) {
    skippedCount++;
    console.warn(`Skipped item ${raw.bildnummer}: ${error}`);
  }
}

// Ensure output directory exists
const outputDir = dirname(outputPath);
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Write to file
console.log('\nWriting to file...');
writeFileSync(outputPath, JSON.stringify(processedItems, null, 2));

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

// Summary
console.log('\n' + '='.repeat(60));
console.log('GENERATION COMPLETE');
console.log('='.repeat(60));
console.log(`Ended at: ${new Date().toISOString()}`);
console.log(`Duration: ${duration}s`);
console.log(`Total items: ${processedItems.length.toLocaleString()}`);
console.log(`Skipped items: ${skippedCount}`);
console.log('\nData quality:');
console.log(`  - Dirty dates (DD.MM.YYYY): ${dirtyDateCount} (${((dirtyDateCount / processedItems.length) * 100).toFixed(1)}%)`);
console.log(`  - Items with restrictions: ${restrictionCount} (${((restrictionCount / processedItems.length) * 100).toFixed(1)}%)`);

// Sample items for verification
console.log('\nSample items:');
console.log('\n--- Item 1 ---');
console.log(JSON.stringify(processedItems[0], null, 2));
console.log('\n--- Item 1000 ---');
console.log(JSON.stringify(processedItems[999], null, 2));

console.log('\n' + '='.repeat(60));
console.log(`Output written to: ${outputPath}`);
console.log('='.repeat(60));
