import * as types from './actionsTypes';

export function dimensionsWindow(window) {
	return {
		type: types.DIMENSIONS.WINDOW,
		window
	};
}

export function dimensionsScreen(screen) {
	return {
		type: types.DIMENSIONS.SCREEN,
		screen
	};
}
