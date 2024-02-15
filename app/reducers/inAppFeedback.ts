import { IN_APP_FEEDBACK } from '../actions/actionsTypes';
import { TApplicationActions } from '../definitions';

export interface IInAppFeedbackState {
	[key: string]: string;
}

export const initialState: IInAppFeedbackState = {};

export default function inAppFeedback(state = initialState, action: TApplicationActions): IInAppFeedbackState {
	switch (action.type) {
		case IN_APP_FEEDBACK.SET:
			const { msgId } = action;
			return {
				...state,
				[msgId]: msgId
			};
		case IN_APP_FEEDBACK.REMOVE:
			const newState = { ...state };
			delete newState[action.msgId];
			return newState;
		case IN_APP_FEEDBACK.CLEAR:
			return initialState;
		default:
			return state;
	}
}
