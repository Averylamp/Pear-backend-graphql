import 'babel-core/register';
import 'babel-polyfill';
// import { start } from './start';
import { uploadImagesFromFolder } from './tests/ImageUploads';

const debug = require('debug')('dev:Index');

debug('Starting...');

uploadImagesFromFolder('avery');

// start();
