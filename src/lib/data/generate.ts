/**
 * Data generation utilities for creating realistic German media items.
 *
 * Uses Faker.js with German locale to generate synthetic but realistic
 * media metadata including photographers, locations, topics, and dates.
 *
 * Key design decisions:
 * - Keyword-style metadata (not prose sentences)
 * - Mix of clean and dirty data (~30% dirty dates)
 * - Realistic German content (cities, names, topics)
 * - ~10% of items include restriction tokens
 */

import { fakerDE } from '@faker-js/faker';
import type { RawMediaItem } from './types';

/**
 * List of photographers/agencies in IMAGO format.
 * Mix of individual names and agencies as per the spec.
 */
const PHOTOGRAPHERS = [
  // Individual photographers
  'Sven Simon',
  'Ulrich Baumgarten',
  'Martin Schutt',
  'Robert Michael',
  'Oliver Berg',
  'Bernd von Jutrczenka',
  'Kay Nietfeld',
  'Christoph Soeder',
  'Wolfgang Kumm',
  'Michael Kappeler',
  'Markus Schreiber',
  'Tobias Schwarz',
  'Jan Woitas',
  'Annette Riedl',
  'Fabian Sommer',
  // Agencies
  'photothek',
  'United Archives',
  'United Archives International',
  'Xinhua',
  'epd',
  'Eibner',
  'Beautiful Sports',
  'Nordphoto',
  'Westend61',
  'Panthermedia',
];

/**
 * German topics and subjects for suchtext generation.
 * Covers major categories: politics, sports, business, culture, events.
 */
const TOPICS = {
  politics: [
    'Bundestag', 'Bundesrat', 'Bundeskanzler', 'Bundespraesident',
    'CDU', 'SPD', 'Gruene', 'FDP', 'AfD', 'Linke',
    'Regierung', 'Opposition', 'Koalition', 'Fraktion',
    'Ministerium', 'Kabinett', 'Pressekonferenz', 'Wahlkampf',
  ],
  sports: [
    'Fussball', 'Bundesliga', 'DFB', 'Champions League',
    'Handball', 'Basketball', 'Tennis', 'Leichtathletik',
    'Olympia', 'Weltmeisterschaft', 'Europameisterschaft',
    'Training', 'Stadion', 'Mannschaft', 'Trainer', 'Spieler',
  ],
  business: [
    'Wirtschaft', 'Boerse', 'DAX', 'Aktien',
    'Unternehmen', 'Konzern', 'Industrie', 'Handel',
    'Messe', 'Kongress', 'Automobilindustrie', 'Energie',
    'Startup', 'Innovation', 'Digitalisierung', 'Technologie',
  ],
  culture: [
    'Kultur', 'Museum', 'Theater', 'Konzert', 'Festival',
    'Film', 'Premiere', 'Ausstellung', 'Galerie', 'Kunst',
    'Literatur', 'Buchmesse', 'Oper', 'Schauspiel',
  ],
  events: [
    'Demonstration', 'Protest', 'Kundgebung', 'Streik',
    'Feier', 'Zeremonie', 'Empfang', 'Gala', 'Verleihung',
    'Eröffnung', 'Einweihung', 'Jubilaeum', 'Gedenken',
  ],
  general: [
    'Portrait', 'Interview', 'Rede', 'Besuch', 'Treffen',
    'Alltag', 'Arbeit', 'Leben', 'Stadt', 'Land',
  ],
};

/**
 * Restriction tokens that may appear in suchtext.
 * These indicate publication restrictions for specific regions.
 */
const RESTRICTION_TOKENS = [
  'PUBLICATIONxINxGERxONLY',
  'PUBLICATIONxINxGERxSUIxAUTxONLY',
  'EDITORIALxUSExONLY',
  'NOxMODELxRELEASE',
  'NOxPROPERTYxRELEASE',
  'NOxUSExGERMANY',
  'NOxUSExAUSTRIA',
  'NOxUSExSWITZERLAND',
];

/**
 * Common image dimensions (landscape, portrait, square).
 */
const DIMENSIONS = {
  landscape: [
    { hoehe: 600, breite: 800 },
    { hoehe: 800, breite: 1200 },
    { hoehe: 1024, breite: 1536 },
    { hoehe: 1200, breite: 1800 },
    { hoehe: 1600, breite: 2400 },
  ],
  portrait: [
    { hoehe: 800, breite: 600 },
    { hoehe: 1200, breite: 800 },
    { hoehe: 1536, breite: 1024 },
    { hoehe: 1800, breite: 1200 },
    { hoehe: 2400, breite: 1600 },
  ],
  square: [
    { hoehe: 800, breite: 800 },
    { hoehe: 1024, breite: 1024 },
    { hoehe: 1200, breite: 1200 },
    { hoehe: 1600, breite: 1600 },
  ],
};

/**
 * Generate a photographer name in IMAGO format.
 *
 * @returns Photographer string in "IMAGO / [source]" format
 *
 * @example
 * generatePhotographer() // "IMAGO / Sven Simon"
 */
export const generatePhotographer = (): string => {
  const photographer = fakerDE.helpers.arrayElement(PHOTOGRAPHERS);
  return `IMAGO / ${photographer}`;
};

/**
 * Generate keyword-style search text (suchtext).
 *
 * Creates realistic German media metadata with:
 * - Person names (60% probability)
 * - Location (city, sometimes state)
 * - Topic keywords (1-3 from various categories)
 * - Date mention (30% probability)
 * - Restriction tokens (10-20% probability)
 *
 * @returns Keyword-style metadata string (5-30 keywords)
 *
 * @example
 * generateSuchtext() // "Angela Merkel Berlin Brandenburg Politik Bundestag 2023"
 */
export const generateSuchtext = (): string => {
  const parts: string[] = [];

  // Person name (60% of items)
  if (fakerDE.datatype.boolean({ probability: 0.6 })) {
    parts.push(fakerDE.person.fullName());
  }

  // Location - always include city
  parts.push(fakerDE.location.city());

  // Sometimes add state (50%)
  if (fakerDE.datatype.boolean({ probability: 0.5 })) {
    parts.push(fakerDE.location.state());
  }

  // Pick 1-3 topic categories and 1-2 keywords from each
  const categories = fakerDE.helpers.arrayElements(
    Object.keys(TOPICS) as (keyof typeof TOPICS)[],
    { min: 1, max: 3 }
  );

  for (const category of categories) {
    const keywords = fakerDE.helpers.arrayElements(TOPICS[category], { min: 1, max: 2 });
    parts.push(...keywords);
  }

  // Sometimes add a year mention (30%)
  if (fakerDE.datatype.boolean({ probability: 0.3 })) {
    const year = fakerDE.date.between({
      from: '2014-01-01',
      to: '2024-12-31',
    }).getFullYear();
    parts.push(year.toString());
  }

  // Sometimes add descriptive terms
  if (fakerDE.datatype.boolean({ probability: 0.4 })) {
    const descriptors = ['aktuell', 'historisch', 'exklusiv', 'neu', 'Archiv'];
    parts.push(fakerDE.helpers.arrayElement(descriptors));
  }

  // Restriction token (10-20% of items)
  if (fakerDE.datatype.boolean({ probability: 0.15 })) {
    parts.push(fakerDE.helpers.arrayElement(RESTRICTION_TOKENS));
  }

  // Shuffle for natural-looking order
  return fakerDE.helpers.shuffle(parts).join(' ');
};

/**
 * Generate a complete raw media item.
 *
 * Creates realistic German media metadata with:
 * - UUID bildnummer
 * - Keyword-style suchtext
 * - IMAGO-format photographer
 * - Date (70% ISO, 30% DD.MM.YYYY for dirty data)
 * - Random dimensions from landscape/portrait/square
 *
 * @returns Raw media item with potentially dirty data
 *
 * @example
 * generateRawItem() // { bildnummer: "abc-123", suchtext: "...", ... }
 */
export const generateRawItem = (): RawMediaItem => {
  // Generate date (70% ISO, 30% European format for dirty data)
  const date = fakerDE.date.between({
    from: '2014-01-01',
    to: '2024-12-31',
  });

  const isISODate = fakerDE.datatype.boolean({ probability: 0.7 });
  let datum: string;

  if (isISODate) {
    datum = date.toISOString().split('T')[0];
  } else {
    // European DD.MM.YYYY format (dirty data)
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    datum = `${day}.${month}.${year}`;
  }

  // Pick random dimension category and specific dimensions
  const dimensionCategory = fakerDE.helpers.arrayElement(['landscape', 'portrait', 'square'] as const);
  const dimensions = fakerDE.helpers.arrayElement(DIMENSIONS[dimensionCategory]);

  return {
    bildnummer: fakerDE.string.uuid(),
    suchtext: generateSuchtext(),
    fotografen: generatePhotographer(),
    datum,
    hoehe: dimensions.hoehe,
    breite: dimensions.breite,
  };
};
