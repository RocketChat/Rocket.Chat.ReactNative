/* eslint-disable */
import { NativeModules } from 'react-native';
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import sagaPlugin from 'reactotron-redux-saga'

if (__DEV__) {
    const scriptURL = NativeModules.SourceCode.scriptURL;
    const scriptHostname = scriptURL.split('://')[1].split(':')[0];
    Reactotron
        .configure({ host: scriptHostname })
        .useReactNative()
        .use(reactotronRedux())
        .use(sagaPlugin())
        .connect();
    // Running on android device
    // $ adb reverse tcp:9090 tcp:9090
    Reactotron.clear();
    console.warn = Reactotron.log;
}
