import { createContext } from 'react';

import { IEmoji, IMessage, TAnyMessageModel } from '../../definitions';
import { EventTypes } from '../EmojiPicker/interfaces';

type TMessageComposerContextProps = {
	rid: string;
	tmid?: string;
	editing: boolean;
	// TODO: Refactor to "origin"? ShareView | RoomView?
	sharing: boolean;
	message?: IMessage;
	editRequest?: (message: TAnyMessageModel) => Promise<void>;
	editCancel?: () => void;
	onSendMessage: (message: string, tmid?: string) => void;
};

export const MessageComposerContextProps = createContext<TMessageComposerContextProps>({
	rid: '',
	editing: false,
	sharing: false,
	message: undefined,
	editRequest: () => Promise.resolve(),
	editCancel: () => {},
	onSendMessage: () => {}
});

type TMessageComposerContext = {
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
	trackingViewHeight: number;
	keyboardHeight: number;
	// sendMessage(): void;
	setKeyboardHeight: (height: number) => void;
	setTrackingViewHeight: (height: number) => void;
	openEmojiKeyboard(): void;
	closeEmojiKeyboard(): void;
	openSearchEmojiKeyboard(): void;
	setFocused(focused: boolean): void;
	closeEmojiKeyboardAndAction(action?: Function, params?: any): void;
};

export const MessageComposerContext = createContext<TMessageComposerContext>({
	showEmojiKeyboard: false,
	showEmojiSearchbar: false,
	focused: false,
	trackingViewHeight: 0,
	keyboardHeight: 0,
	// sendMessage: () => {},
	setKeyboardHeight: () => {},
	setTrackingViewHeight: () => {},
	openEmojiKeyboard: () => {},
	closeEmojiKeyboard: () => {},
	setFocused: () => {},
	closeEmojiKeyboardAndAction: () => {},
	openSearchEmojiKeyboard: () => {}
});

type TMessageInnerContext = {
	sendMessage(): void;
	onEmojiSelected(emoji: IEmoji): void;
};

export const MessageInnerContext = createContext<TMessageInnerContext>({
	sendMessage: () => {},
	onEmojiSelected: () => {}
});
