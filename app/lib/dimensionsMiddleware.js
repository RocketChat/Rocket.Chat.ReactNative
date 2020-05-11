import { Dimensions } from 'react-native';

import { dimensionsWindow, dimensionsScreen } from '../actions/dimensions';

export default () => createStore => (...args) => {
	const store = createStore(...args);

	const handleDimensionsChange = (nextDimensionState) => {
		if (nextDimensionState) {
			if (nextDimensionState.window) {
				store.dispatch(dimensionsWindow(nextDimensionState.window));
			}
			if (nextDimensionState.screen) {
				store.dispatch(dimensionsScreen(nextDimensionState.screen));
			}
		}
	};

	Dimensions.addEventListener('change', handleDimensionsChange);

	setTimeout(() => handleDimensionsChange({ ...Dimensions.get('window'), ...Dimensions.get('screen') }));
	return store;
};
