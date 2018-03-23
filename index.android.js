import 'babel-polyfill';
import 'regenerator-runtime/runtime';
import { AppRegistry, UIManager } from 'react-native';

import './app/ReactotronConfig';
import './app/push';
import RocketChat from './app/index';

UIManager.setLayoutAnimationEnabledExperimental(true);

AppRegistry.registerComponent('RocketChatRN', () => RocketChat);
