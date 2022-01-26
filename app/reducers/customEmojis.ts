import { SET_CUSTOM_EMOJIS } from '../actions/actionsTypes';
import { TApplicationActions } from '../definitions';

// There are at least three interfaces for emoji, but none of them includes only this data.
interface IEmoji {
	name: string;
	extension: string;
}

export interface ICustomEmojis {
	[key: string]: IEmoji;
}

export const initialState: ICustomEmojis = {};

export default function customEmojis(state = initialState, action: TApplicationActions): ICustomEmojis {
	switch (action.type) {
		case SET_CUSTOM_EMOJIS:
			return action.emojis;
		default:
			return state;
	}
}
