import { SET_CUSTOM_EMOJIS } from '../actions/actionsTypes';
import { type ICustomEmojis } from '../definitions/IEmoji';
import { type TApplicationActions } from '../definitions/redux';

export const initialState: ICustomEmojis = {};

export default function customEmojis(state = initialState, action: TApplicationActions): ICustomEmojis {
	switch (action.type) {
		case SET_CUSTOM_EMOJIS:
			return action.emojis;
		default:
			return state;
	}
}
