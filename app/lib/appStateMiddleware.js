// https://github.com/bamlab/redux-enhancer-react-native-appstate
import { AppState } from 'react-native';

import { APP_STATE } from '../actions/actionsTypes';

export default () => createStore => (...args) => {
	const store = createStore(...args);

	let currentState = '';

	const handleAppStateChange = (nextAppState) => {
		if (nextAppState !== 'inactive') {
			if (currentState !== nextAppState) {
				let type;
				if (nextAppState === 'active') {
					type = APP_STATE.FOREGROUND;
				} else if (nextAppState === 'background') {
					type = APP_STATE.BACKGROUND;
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
