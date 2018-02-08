import 'babel-polyfill';
import 'regenerator-runtime/runtime';
import { AppRegistry } from 'react-native';

import './app/push';
import RocketChat from './app/index';

// UIManager.setLayoutAnimationEnabledExperimental(true);

// import './app/ReactotronConfig';
// import { AppRegistry } from 'react-native';
// import Routes from './app/routes';
//
AppRegistry.registerComponent('RocketChatRN', () => RocketChat);
