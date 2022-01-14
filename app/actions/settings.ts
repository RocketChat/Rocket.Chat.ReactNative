import { Action } from 'redux';

import { ISettings } from '../reducers/settings';
import { SETTINGS } from './actionsTypes';

interface IAddSettings extends Action {
	payload: ISettings;
}

interface IUpdateSettings extends Action {
	payload: { id: string; value: string };
}

export type IActionSettings = IAddSettings & IUpdateSettings;

export function addSettings(settings: ISettings): IAddSettings {
	return {
		type: SETTINGS.ADD,
		payload: settings
	};
}

export function updateSettings(id: string, value: string): IUpdateSettings {
	return {
		type: SETTINGS.UPDATE,
		payload: { id, value }
	};
}

export function clearSettings(): Action {
	return {
		type: SETTINGS.CLEAR
	};
}
