import type { Action } from 'redux';

import { SET_CUSTOM_EMOJIS } from './actionsTypes';
import type { ICustomEmojis } from '../definitions';

export type ISetCustomEmojis = Action & { emojis: ICustomEmojis; }

export type TActionCustomEmojis = ISetCustomEmojis;

export function setCustomEmojis(emojis: ICustomEmojis): ISetCustomEmojis {
	return {
		type: SET_CUSTOM_EMOJIS,
		emojis
	};
}
