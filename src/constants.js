export const DISCOVERY_RATE_LIMIT = [
  {
    intervalLengthMillis: 24 * 60 * 60 * 1000,
    limit: 50,
  }, {
    intervalLengthMillis: 3 * 60 * 60 * 1000,
    limit: 20,
  },
];

export const DISCOVERY_EVENT_RATE_LIMIT = [
  // unlimited
];

export const SEEDED_PROFILES_START = 10;

export const MAX_DISCOVERY_CARDS_RETRIEVE = 30;

export const DISCOVERY_REFRESH_THRESHOLD = 20;

export const DISCOVERY_CACHE_SIZE = 30;

export const STAT_SNAPSHOT_GENERATION_TIME = 30 * 60 * 1000;

export const LAST_ACTIVE_ARRAY_LEN = 50;

export const LAST_EDITED_ARRAY_LEN = 20;

export const FUZZY_SCHOOL_LIST = [
  'Harvard',
  'harvard',
  'Harvard University',
  'Harvard College',
  'harvard university',
  'harvard college',
  'Harvard university',
  'Harvard college',
  'MIT',
  'mit',
  'M.I.T.',
  'M.I.T',
  'Massachusetts Institute of Technology',
  'massachusetts institute of technology',
  'Mass Tech',
  'mass tech',
  'Stanford',
  'stanford',
  'Stanford University',
  'Wellesley',
  'wellesley',
  'Wellesley College',
  'wellesley college',
  'Wellesley college',
];

export const devMode = process.env.DEV === 'true';

export const regenTestDBMode = (process.env.TASK === 'regen-db' && devMode);

export const performingMigration1 = process.env.TASK === 'migration1';

export const performingMigration2 = process.env.TASK === 'migration2';

export const performingMigration0621192 = process.env.TASK === 'migration062119-2';
export const performingMigration062119 = process.env.TASK === 'migration062119';
export const performingMigration062019 = process.env.TASK === 'migration062019';

export const verbose = process.env.VERBOSE ? process.env.VERBOSE : false;
