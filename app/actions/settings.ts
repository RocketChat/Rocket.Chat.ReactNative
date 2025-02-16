import type { Action } from 'redux';

import type { TSettingsState, TSupportedSettings, TSettingsValues } from '../reducers/settings';
import { SETTINGS } from './actionsTypes';

type IAddSettings = Action & { payload: TSettingsState; }

type IUpdateSettings = Action & { payload: { id: TSupportedSettings; value: TSettingsValues }; }

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
