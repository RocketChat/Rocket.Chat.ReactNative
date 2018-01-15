import 'babel-polyfill';
import 'regenerator-runtime/runtime';
import { AppRegistry } from 'react-native';


import './app/push';
import RocketChat from './app/index';
// import { AppRegistry } from 'react-native';
// import Routes from './app/routes';
// import './app/ReactotronConfig';
//
AppRegistry.registerComponent('RocketChatRN', () => RocketChat);
