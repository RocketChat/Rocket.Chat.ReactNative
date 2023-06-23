import { IMessage } from '../../definitions';

export interface IMessageComposerProps {
	rid: string;
	// baseUrl: string;
	message?: IMessage;
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
	editCancel?: () => void;
	editRequest?: (message: Pick<IMessage, 'id' | 'msg' | 'rid'>) => Promise<void>;
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
}

export interface IComposerInputProps {
	inputRef: any; // FIXME: how do I type this?
}

export interface ITrackingView {
	resetTracking: () => void;
}
