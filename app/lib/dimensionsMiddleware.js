import { Dimensions } from 'react-native';
import { isEqual } from 'lodash';


import { dimensionsWindow } from '../actions/dimensions';

export default () => createStore => (...args) => {
	const store = createStore(...args);

	let currentDimensions = '';

	const handleDimensionsChange = (nextDimensionState) => {
		if (!isEqual(currentDimensions, nextDimensionState)) {
			if (nextDimensionState) {
				if (nextDimensionState.window) {
					store.dispatch(dimensionsWindow(nextDimensionState.window));
				}
			}
			currentDimensions = nextDimensionState;
		}
	};

	Dimensions.addEventListener('change', handleDimensionsChange);

	setTimeout(() => handleDimensionsChange(Dimensions.get('window')));
	return store;
};
