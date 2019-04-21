import 'react-native-console-time-polyfill';

import './app/ReactotronConfig';
import { AppRegistry } from 'react-native';
import App from './app/index';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

// For storybook, comment everything above and uncomment below
// import './storybook';
