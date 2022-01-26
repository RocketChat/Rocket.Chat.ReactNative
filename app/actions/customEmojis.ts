import { Action } from 'redux';

import { ICustomEmojis } from '../reducers/customEmojis';
import { SET_CUSTOM_EMOJIS } from './actionsTypes';

export interface ISetCustomEmojis extends Action {
	emojis: ICustomEmojis;
}

export type TActionCustomEmojis = ISetCustomEmojis;

export function setCustomEmojis(emojis: ICustomEmojis): ISetCustomEmojis {
	return {
		type: SET_CUSTOM_EMOJIS,
		emojis
	};
}
