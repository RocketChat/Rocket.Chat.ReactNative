import { IActionSettings } from '../actions/settings';
import { SETTINGS } from '../actions/actionsTypes';
import { defaultSettings } from '../lib/constants';

export type TSupportedSettings = keyof typeof defaultSettings;
export type TSettingsValues = string | number | boolean | string[];

export type TSettingsState = {
	[K in TSupportedSettings]?: TSettingsValues;
};

export const initialState: TSettingsState = {};

export default (state = initialState, action: IActionSettings): TSettingsState => {
	switch (action.type) {
		case SETTINGS.ADD:
			return {
				...state,
				...action.payload
			};
		case SETTINGS.UPDATE:
			return {
				...state,
				[action.payload.id]: action.payload.value
			};
		case SETTINGS.CLEAR:
			return initialState;
		default:
			return state;
	}
};
