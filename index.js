import '@babel/polyfill';
import 'regenerator-runtime/runtime';

import './app/ReactotronConfig';
import './app/push';
import App from './app/index';

// eslint-disable-next-line
const app = new App();
