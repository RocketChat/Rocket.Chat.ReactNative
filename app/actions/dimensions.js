import { DIMENSIONS } from './actionsTypes';

export function dimensionsWindow(window) {
	return {
		type: DIMENSIONS.WINDOW,
		window
	};
}
