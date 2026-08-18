import { SET_APPS_LANGUAGES } from '../actions/actionsTypes';
import { type IAppsState, type TApplicationActions } from '../definitions';

export const initialState: IAppsState = {
	languages: {}
};

export default function apps(state = initialState, action: TApplicationActions): IAppsState {
	switch (action.type) {
		case SET_APPS_LANGUAGES:
			return { ...state, languages: action.languages };
		default:
			return state;
	}
}
