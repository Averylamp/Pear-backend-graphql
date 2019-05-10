export const MAX_FEED_LENGTH = 50;

export const INITIALIZED_FEED_LENGTH = 20;

export const NEW_PROFILE_BONUS = 2;

export const TICK_LENGTH_MILLIS = 1000 * 60;

export const EXPECTED_TICKS_PER_NEW_PROFILE = 100;

export const STAT_SNAPSHOT_GENERATION_TIME = 30 * 60 * 1000;

export const LAST_ACTIVE_ARRAY_LEN = 20;

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

export const verbose = process.env.VERBOSE ? process.env.VERBOSE : false;
