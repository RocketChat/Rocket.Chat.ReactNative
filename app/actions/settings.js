import { SETTINGS } from './actionsTypes';

export function addSettings(settings) {
	return {
		type: SETTINGS.ADD,
		payload: settings
	};
}

export function updateSetting(id, value) {
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
