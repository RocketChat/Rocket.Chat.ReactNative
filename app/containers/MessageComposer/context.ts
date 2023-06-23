import { createContext } from 'react';

import { TMicOrSend } from './interfaces';
import { IEmoji, IMessage, TAnyMessageModel } from '../../definitions';

type TMessageComposerContext = {
	rid: string;
	tmid?: string;
	editing: boolean;
	// TODO: Refactor to "origin"? ShareView | RoomView?
	sharing: boolean;
	micOrSend: TMicOrSend;
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
	permissionToUpload: boolean;
	setMicOrSend(type: TMicOrSend): void;
	sendMessage(): void;
	openEmojiKeyboard(): void;
	closeEmojiKeyboard(): void;
	setFocused(focused: boolean): void;
	onEmojiSelected(emoji: IEmoji): void;
	takePhoto(): void;
	takeVideo(): void;
	chooseFromLibrary(): void;
	chooseFile(): void;
	closeEmojiKeyboardAndAction(action?: Function, params?: any): void;
	message?: IMessage;
	editCancel?: () => void;
	editRequest?: (message: TAnyMessageModel) => Promise<void>;
};

export const MessageComposerContext = createContext<TMessageComposerContext>({
	rid: '',
	micOrSend: 'mic',
	editing: false,
	sharing: false,
	showEmojiKeyboard: false,
	showEmojiSearchbar: false,
	focused: false,
	permissionToUpload: false,
	setMicOrSend: () => {},
	sendMessage: () => {},
	openEmojiKeyboard: () => {},
	closeEmojiKeyboard: () => {},
	setFocused: () => {},
	onEmojiSelected: () => {},
	takePhoto: () => {},
	takeVideo: () => {},
	chooseFromLibrary: () => {},
	chooseFile: () => {},
	closeEmojiKeyboardAndAction: () => {},
	message: undefined,
	editCancel: () => {},
	editRequest: async () => {}
});
