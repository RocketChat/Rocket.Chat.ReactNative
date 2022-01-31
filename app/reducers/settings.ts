import { IActionSettings } from '../actions/settings';
import { SETTINGS } from '../actions/actionsTypes';

// TODO UPDATE SETTINGS TYPE
export type ISettings = Record<string, any>;

export const initialState: ISettings = {};

export default (state = initialState, action: IActionSettings): ISettings => {
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
