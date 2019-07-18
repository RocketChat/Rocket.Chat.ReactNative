import 'react-native-console-time-polyfill';

import './app/ReactotronConfig';
import { AppRegistry } from 'react-native';
import { name as appName, share as shareName } from './app.json';

AppRegistry.registerComponent(appName, () => require('./app/index').default);
AppRegistry.registerComponent(shareName, () => require('./app/share').default);

// For storybook, comment everything above and uncomment below
// import './storybook';
