import { IEmoji, IPreviewItem, TUserStatus } from '../../definitions';

export interface IMessageComposerRef {
	closeEmojiKeyboardAndAction: (action?: Function, params?: any) => void;
}

export interface IInputSelection {
	start: number;
	end: number;
}

export type TSetInput = (text: string, selection?: IInputSelection) => void;

export type TMicOrSend = 'mic' | 'send';

export interface IComposerInput {
	getTextAndClear: () => string;
	getText: () => string;
	getSelection: () => IInputSelection;
	setInput: TSetInput;
	focus: () => void;
}

export interface IComposerInputProps {
	inputRef: any; // FIXME: how do I type this?
}

export interface ITrackingView {
	resetTracking: () => void;
	getNativeProps: () => any;
}

export type TAutocompleteType = '@' | '#' | '!' | ':' | '/' | '/preview' | 'loading' | null;

export interface IAutocompleteBase {
	type: TAutocompleteType;
	text: string;
	params?: string;
}

export interface IAutocompleteUserRoom {
	id: string;
	title: string;
	subtitle?: string;
	outside?: boolean;
	t: string;
	status?: TUserStatus;
	teamMain?: boolean;
	type: '@' | '#';
}

export interface IAutocompleteEmoji {
	id: string;
	emoji: IEmoji;
	type: ':';
}

export interface IAutocompleteSlashCommand {
	id: string;
	title: string;
	subtitle?: string;
	type: '/';
}

export interface IAutocompleteSlashCommandPreview {
	id: string;
	preview: IPreviewItem;
	type: '/preview';
	text: string;
	params: string;
}

export interface IAutocompleteCannedResponse {
	id: string;
	title: string;
	subtitle?: string;
	type: '!';
}

export interface IAutocompleteLoading {
	id: 'loading';
	type: 'loading';
}

export type TAutocompleteItem =
	| IAutocompleteUserRoom
	| IAutocompleteEmoji
	| IAutocompleteSlashCommand
	| IAutocompleteSlashCommandPreview
	| IAutocompleteCannedResponse
	| IAutocompleteLoading;

export interface IAutocompleteItemProps {
	item: TAutocompleteItem;
	onPress: (item: TAutocompleteItem) => void;
}
