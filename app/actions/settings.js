import { SETTINGS } from './actionsTypes';

export function addSettings(settings) {
	return {
		type: SETTINGS.ADD,
		payload: settings
	};
}

export function updateSettings(id, value) {
	return {
		type: SETTINGS.UPDATE,
		payload: { id, value }
	};
}

export function clearSettings() {
	return {
		type: SETTINGS.CLEAR
	};
}
