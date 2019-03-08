import 'babel-core/register';
import 'babel-polyfill';
import { start } from './start';

const debug = require('debug')('dev:Index');

debug('Starting...');
start();
