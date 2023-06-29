import { createContext } from 'react';

import { TAutocompleteType, TMicOrSend } from './interfaces';
import { IEmoji } from '../../definitions';

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
	trackingViewHeight: number;
	keyboardHeight: number;
	autocompleteType: TAutocompleteType;
	setAutocompleteType: (type: TAutocompleteType) => void;
	autocompleteText: string;
	setAutocompleteText: (text: string) => void;
	setTrackingViewHeight: (height: number) => void;
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
	trackingViewHeight: 0,
	keyboardHeight: 0,
	autocompleteType: null,
	autocompleteText: '',
	setAutocompleteText: () => {},
	setAutocompleteType: () => {},
	setTrackingViewHeight: () => {},
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
	closeEmojiKeyboardAndAction: () => {}
});
