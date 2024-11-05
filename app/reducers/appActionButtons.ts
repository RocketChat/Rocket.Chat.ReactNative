import { APP_ACTION_BUTTON } from '../actions/actionsTypes';
import { IAppActionButtonsState, TActionAppActionButtons } from '../actions/appActionButtons';

export const initialState: IAppActionButtonsState = {};

export default function appActionButtons(state = initialState, action: TActionAppActionButtons): IAppActionButtonsState {
	switch (action.type) {
		case APP_ACTION_BUTTON.SET:
			return action.appActionButtons;
		case APP_ACTION_BUTTON.UPDATE:
			return {
				...state,
				[action.payload.id]: action.payload.appActionButton
			};
		case APP_ACTION_BUTTON.REMOVE: {
			const newState = { ...state };
			delete newState[action.payload.id];
			return newState;
		}
		default:
			return state;
	}
}
