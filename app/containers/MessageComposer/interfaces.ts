export interface IMessageBoxProps {
	// rid: string;
	// baseUrl: string;
	// // message: IMessage;
	// // replying: boolean;
	// // editing: boolean;
	// threadsEnabled: boolean;
	// // isFocused(): boolean;
	// // user: IUser;
	// roomType: string;
	// tmid: string;
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
	// // sharing: boolean;
	// isActionsEnabled: boolean;
	// // usedCannedResponse: string;
	// // uploadFilePermission: string[];
	// // goToCannedResponses: () => void | null;
	// serverVersion: string;
}

export interface IInputSelection {
	start: number;
	end: number;
}

export type TMicOrSend = 'mic' | 'send';

export interface IComposerInput {
	clearInput: () => void;
	getText: () => string;
}
