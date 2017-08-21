import * as types from './actionsTypes';

export default function setNavigation(navigator = {}) {
	return {
		type: types.NAVIGATION.SET,
		navigator
	};
}
