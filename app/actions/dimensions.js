import { DIMENSIONS } from './actionsTypes';

export function dimensionsWindow(window) {
	return {
		type: DIMENSIONS.WINDOW,
		window
	};
}

export function dimensionsScreen(screen) {
	return {
		type: DIMENSIONS.SCREEN,
		screen
	};
}
