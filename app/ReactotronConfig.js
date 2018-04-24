/* eslint-disable */
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import sagaPlugin from 'reactotron-redux-saga'

if (__DEV__) {
    Reactotron
        .configure()
        .useReactNative()
        .use(reactotronRedux())
        .use(sagaPlugin())
        .connect();
    // Running on android device
    // $ adb reverse tcp:9090 tcp:9090
}
