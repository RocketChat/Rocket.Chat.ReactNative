import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, LogBox } from 'react-native';
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';

if (__DEV__) {
	const { scriptURL } = NativeModules.SourceCode;
	const scriptHostname = scriptURL.split('://')[1].split(':')[0];
	Reactotron.setAsyncStorageHandler?.(AsyncStorage)
		.configure({ host: scriptHostname })
		.useReactNative()
		.use(reactotronRedux())
		// .use(reactotronReduxSaga())
		.connect();
	// Running on android device
	// $ adb reverse tcp:9090 tcp:9090
	Reactotron.clear?.();
	// @ts-ignore
	console.warn = Reactotron.log;
	// @ts-ignore
	console.log = Reactotron.log;
	LogBox.ignoreAllLogs(true);
}
