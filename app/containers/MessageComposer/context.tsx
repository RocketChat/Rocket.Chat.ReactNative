import { createContext } from 'react';

import { type IEmoji } from '../../definitions';
import { type TSetInput } from './interfaces';

type TMessageInnerContext = {
	sendMessage(): void;
	onEmojiSelected(emoji: IEmoji): void;
	closeEmojiKeyboardAndAction(onClosed?: Function, params?: any): void;
	focus(): void;
	getText(): string;
	setInput: TSetInput;
};

export const MessageInnerContext = createContext<TMessageInnerContext>({
	sendMessage: () => {},
	onEmojiSelected: () => {},
	closeEmojiKeyboardAndAction: () => {},
	focus: () => {},
	getText: () => '',
	setInput: () => {}
});
