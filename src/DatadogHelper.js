const { StatsD } = require('node-dogstatsd');

export const datadogStats = new StatsD();
