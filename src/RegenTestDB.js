import 'babel-core/register';
import 'babel-polyfill';
import { start } from './start';

const debug = require('debug')('dev:RegenTestDB');

debug('Starting...');
start(true);
