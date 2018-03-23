import 'babel-polyfill';
import 'regenerator-runtime/runtime';
import { AppRegistry } from 'react-native';

import './app/ReactotronConfig';
import './app/push';
import RocketChat from './app/index';

AppRegistry.registerComponent('RocketChatRN', () => RocketChat);
