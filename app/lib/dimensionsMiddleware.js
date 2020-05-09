import { Dimensions } from 'react-native';

import { DIMENSIONS } from '../actions/actionsTypes';

export default () => createStore => (...args) => {
	const store = createStore(...args);

	let currentState = '';
	let payload = '';

	const handleDimensionsChange = (nextDimensionState) => {
		if (currentState !== nextDimensionState) {
			let type;
			if (nextDimensionState === 'window') {
				type = DIMENSIONS.WINDOW;
				payload = Dimensions.get('window');
			} else if (nextDimensionState === 'screen') {
				type = DIMENSIONS.SCREEN;
				payload = Dimensions.get('screen');
			}
			if (type) {
				store.dispatch({
					type,
					payload
				});
			}
		}
		currentState = nextDimensionState;
	};

	Dimensions.addEventListener('change', handleDimensionsChange);

	setTimeout(() => handleDimensionsChange(Dimensions.currentState));
	return store;
};
