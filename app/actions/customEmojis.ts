import { Action } from 'redux';

import { SET_CUSTOM_EMOJIS } from './actionsTypes';
import { ICustomEmojis } from '../definitions';

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
