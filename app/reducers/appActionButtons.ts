import { IAppActionButton } from '../definitions';
import { APP_ACTION_BUTTON } from '../actions/actionsTypes';
import { TActionAppActionButtons } from '../actions/appActionButtons';

export type IAppActionButtonsState = Record<string, IAppActionButton>;

export const initialState: IAppActionButtonsState = {};

export default function appActionButtons(state = initialState, action: TActionAppActionButtons): IAppActionButtonsState {
	switch (action.type) {
		case APP_ACTION_BUTTON.SET:
			return action.appActionButtons;
		case APP_ACTION_BUTTON.REMOVE_BY_APPID: {
			const newState = { ...state };
			Object.keys(newState).forEach(key => {
				const [appId] = key.split('/');
				if (appId === action.payload.appId) {
					delete newState[key];
				}
			});
			return newState;
		}
		default:
			return state;
	}
}
