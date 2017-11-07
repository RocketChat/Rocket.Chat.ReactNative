import 'babel-polyfill';
import 'regenerator-runtime/runtime';
import { AppRegistry } from 'react-native';


import RocketChat from './app/index';
// import { AppRegistry } from 'react-native';
// import Routes from './app/routes';
//
AppRegistry.registerComponent('RocketChatRN', () => RocketChat);
