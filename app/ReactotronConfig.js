/* eslint-disable */
import Reactotron, { asyncStorage, networking, openInEditor } from 'reactotron-react-native';
import { NativeModules } from 'react-native';

import { reactotronRedux } from 'reactotron-redux';

// uncomment the following lines to test on a device
// let scriptHostname;
// if (__DEV__) {
//   const scriptURL = NativeModules.SourceCode.scriptURL;
//   scriptHostname = scriptURL.split('://')[1].split(':')[0];
// }

Reactotron.configure(/*{ host: scriptHostname }*/) // controls connection & communication settings
  .useReactNative() // add all built-in react native plugins
  .use(reactotronRedux())
  .use(asyncStorage())
  .use(networking())
  .use(openInEditor())
  .connect();
