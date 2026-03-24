import { type IActionSettings } from '../actions/settings';
import { SETTINGS } from '../actions/actionsTypes';
import { type defaultSettings } from '../lib/constants/defaultSettings';
import { type IAssetsFavicon512 } from '../definitions/IAssetsFavicon512';

export type TSupportedSettings = keyof typeof defaultSettings;
export type TSettingsValues = string | number | boolean | string[] | IAssetsFavicon512;

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
