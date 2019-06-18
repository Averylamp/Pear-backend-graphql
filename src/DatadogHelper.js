import { devMode } from './constants';

const { StatsD } = require('node-dogstatsd');

class StatsDDev {
  increment() {}
}

export const datadogStats = devMode ? new StatsD() : new StatsDDev();
