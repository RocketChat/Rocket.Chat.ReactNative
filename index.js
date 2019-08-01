import 'react-native-console-time-polyfill';

import './app/ReactotronConfig';
import { AppRegistry } from 'react-native';
import { Client } from 'bugsnag-react-native';
import { name as appName, share as shareName } from './app.json';

const bugsnag = new Client('72a0364cb361fc8f0fdc6cbf605f9963');
bugsnag.notify(new Error('Test error'));

AppRegistry.registerComponent(appName, () => require('./app/index').default);
AppRegistry.registerComponent(shareName, () => require('./app/share').default);

// For storybook, comment everything above and uncomment below
// import './storybook';
