import { createContext } from 'react';

import { TMicOrSend } from './interfaces';
import { IEmoji } from '../../definitions';

type TMessageComposerContext = {
	rid: string;
	tmid?: string;
	// TODO: Refactor to "origin"? ShareView | RoomView?
	sharing: boolean;
	micOrSend: TMicOrSend;
	setMicOrSend(type: TMicOrSend): void;
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	sendMessage(): void;
	openEmojiKeyboard(): void;
	closeEmojiKeyboard(): void;
	onEmojiSelected(emoji: IEmoji): void;
};

export const MessageComposerContext = createContext<TMessageComposerContext>({
	rid: '',
	micOrSend: 'mic',
	setMicOrSend: () => {},
	sharing: false,
	showEmojiKeyboard: false,
	showEmojiSearchbar: false,
	sendMessage: () => {},
	openEmojiKeyboard: () => {},
	closeEmojiKeyboard: () => {},
	onEmojiSelected: () => {}
});
