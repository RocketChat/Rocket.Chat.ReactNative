import { IEmoji, IPreviewItem, TUserStatus } from '../../definitions';

export interface IMessageComposerProps {
	rid: string;
	// baseUrl: string;
	// // message: IMessage;
	// // replying: boolean;
	editing: boolean;
	// threadsEnabled: boolean;
	// // isFocused(): boolean;
	// // user: IUser;
	// roomType: string;
	tmid?: string;
	// // replyWithMention: boolean;
	// FileUpload_MediaTypeWhiteList: string;
	// FileUpload_MaxFileSize: number;
	// // Message_AudioRecorderEnabled: boolean;
	// getCustomEmoji: TGetCustomEmoji;
	// // editCancel: Function;
	// // editRequest: Function;
	// TODO: discuss this prop name
	onSendMessage(message: string, tmid?: string, tshow?: boolean): void;
	// typing: Function;
	// // theme: TSupportedThemes;
	// // replyCancel(): void;
	// showSend: boolean;
	// children: JSX.Element;
	// isMasterDetail: boolean;
	// showActionSheet: Function;
	// // iOSScrollBehavior: number;
	sharing: boolean;
	// isActionsEnabled: boolean;
	// // usedCannedResponse: string;
	// // uploadFilePermission: string[];
	// // goToCannedResponses: () => void | null;
	// serverVersion: string;
}

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
	sendMessage: () => string;
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
