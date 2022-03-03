import { Action } from 'redux';

import { TSettingsState, TSupportedSettings, TSettingsValues } from '../reducers/settings';
import { SETTINGS } from './actionsTypes';

interface IAddSettings extends Action {
	payload: TSettingsState;
}

interface IUpdateSettings extends Action {
	payload: { id: TSupportedSettings; value: TSettingsValues };
}

export type IActionSettings = IAddSettings & IUpdateSettings;

export function addSettings(settings: TSettingsState): IAddSettings {
	return {
		type: SETTINGS.ADD,
		payload: settings
	};
}

export function updateSettings(id: TSupportedSettings, value: TSettingsValues): IUpdateSettings {
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
