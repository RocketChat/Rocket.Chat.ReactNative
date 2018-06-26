import 'babel-polyfill';
import 'regenerator-runtime/runtime';

import './app/ReactotronConfig';
import './app/push';

const { start } = require('./app/index');

start();
