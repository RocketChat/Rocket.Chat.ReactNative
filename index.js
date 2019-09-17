import 'react-native-console-time-polyfill';
import { AppRegistry } from 'react-native';
import joypixels from 'emoji-toolkit';
import { name as appName, share as shareName } from './app.json';

joypixels.ascii = true;

if (__DEV__) {
	require('./app/ReactotronConfig');
}

AppRegistry.registerComponent(appName, () => require('./app/index').default);
AppRegistry.registerComponent(shareName, () => require('./app/share').default);

// For storybook, comment everything above and uncomment below
// import './storybook';
