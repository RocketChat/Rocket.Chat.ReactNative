import { type ReactElement } from 'react';

import { type IEmoji, type IPreviewItem, type TUserStatus } from '../../definitions';

export interface IMessageComposerRef {
	closeEmojiKeyboardAndAction: (action?: Function, params?: any) => void;
	getText: () => string;
	setInput: TSetInput;
}

export interface IMessageComposerContainerProps {
	children?: ReactElement;
}

export interface IInputSelection {
	start: number;
	end: number;
}

/**
 * @param text - text value to set in the input field
 * @param selection - (Optional) text selection range, start and end. if not passed cursor will be set where it is (end)
 * @param forceUpdateDraftMessage - (Optional) forces immediate saving of message draft.
 */
export type TSetInput = (text: string, selection?: IInputSelection, forceUpdateDraftMessage?: boolean) => void;

export type TMicOrSend = 'mic' | 'send';

export interface IComposerInput {
	getTextAndClear: () => string;
	getText: () => string;
	getSelection: () => IInputSelection;
	setInput: TSetInput;
	onAutocompleteItemSelected: (item: TAutocompleteItem) => void;
	focus: () => void;
}

export interface IComposerInputProps {
	inputRef: any; // FIXME: how do I type this?
}

export type TMarkdownStyle = 'bold' | 'italic' | 'strike' | 'code' | 'code-block';

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
