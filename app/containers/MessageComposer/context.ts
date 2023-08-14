import { createContext } from 'react';

import { IEmoji, IMessage } from '../../definitions';

type TMessageComposerContextProps = {
	rid: string;
	tmid?: string;
	editing: boolean;
	// TODO: Refactor to "origin"? ShareView | RoomView?
	sharing: boolean;
	message?: IMessage;
	editCancel?: () => void;
};

export const MessageComposerContextProps = createContext<TMessageComposerContextProps>({
	rid: '',
	editing: false,
	sharing: false,
	message: undefined,
	editCancel: () => {}
});

type TMessageComposerContext = {
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
	trackingViewHeight: number;
	keyboardHeight: number;
	sendMessage(): void;
	setTrackingViewHeight: (height: number) => void;
	openEmojiKeyboard(): void;
	closeEmojiKeyboard(): void;
	setFocused(focused: boolean): void;
	onEmojiSelected(emoji: IEmoji): void;
	closeEmojiKeyboardAndAction(action?: Function, params?: any): void;
};

export const MessageComposerContext = createContext<TMessageComposerContext>({
	showEmojiKeyboard: false,
	showEmojiSearchbar: false,
	focused: false,
	trackingViewHeight: 0,
	keyboardHeight: 0,
	sendMessage: () => {},
	setTrackingViewHeight: () => {},
	openEmojiKeyboard: () => {},
	closeEmojiKeyboard: () => {},
	setFocused: () => {},
	onEmojiSelected: () => {},
	closeEmojiKeyboardAndAction: () => {}
});
