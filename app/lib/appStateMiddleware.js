// https://github.com/bamlab/redux-enhancer-react-native-appstate
import { AppState } from 'react-native';

export const FOREGROUND = 'APP_STATE.FOREGROUND';
export const BACKGROUND = 'APP_STATE.BACKGROUND';
export const INACTIVE = 'APP_STATE.INACTIVE';

export default () => createStore => (...args) => {
	const store = createStore(...args);

	let currentState = '';

	const handleAppStateChange = (nextAppState) => {
		if (nextAppState !== 'inactive') {
			if (currentState !== nextAppState) {
				let type;
				if (nextAppState === 'active') {
					type = FOREGROUND;
				} else if (nextAppState === 'background') {
					type = BACKGROUND;
				}
				if (type) {
					store.dispatch({
						type
					});
				}
			}
			currentState = nextAppState;
		}
	};

	AppState.addEventListener('change', handleAppStateChange);

	// setTimeout to allow redux-saga to catch the initial state fired by redux-enhancer-react-native-appstate library
	setTimeout(() => handleAppStateChange(AppState.currentState));
	return store;
};
