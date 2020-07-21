import { SETTINGS } from './actionsTypes';

export function addSettings(settings) {
	return {
		type: SETTINGS.ADD,
		payload: settings
	};
}

export function clearSettings() {
	return {
		type: SETTINGS.CLEAR
	};
}
