import { SET_CUSTOM_EMOJIS } from '../actions/actionsTypes';
import { ICustomEmojis, TApplicationActions } from '../definitions';

export const initialState: ICustomEmojis = {};

export default function customEmojis(state = initialState, action: TApplicationActions): ICustomEmojis {
	switch (action.type) {
		case SET_CUSTOM_EMOJIS:
			return action.emojis;
		default:
			return state;
	}
}
