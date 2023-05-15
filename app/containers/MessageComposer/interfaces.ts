import { TSupportedThemes } from '../../theme';
import { IBaseScreen, IMessage, IUser, TGetCustomEmoji } from '../../definitions';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';

export interface IMessageBoxProps extends IBaseScreen<ChatsStackParamList & MasterDetailInsideStackParamList, any> {
	rid: string;
	baseUrl: string;
	// message: IMessage;
	// replying: boolean;
	// editing: boolean;
	threadsEnabled: boolean;
	// isFocused(): boolean;
	// user: IUser;
	roomType: string;
	tmid: string;
	// replyWithMention: boolean;
	FileUpload_MediaTypeWhiteList: string;
	FileUpload_MaxFileSize: number;
	// Message_AudioRecorderEnabled: boolean;
	getCustomEmoji: TGetCustomEmoji;
	// editCancel: Function;
	// editRequest: Function;
	onSubmit: Function;
	typing: Function;
	// theme: TSupportedThemes;
	// replyCancel(): void;
	showSend: boolean;
	children: JSX.Element;
	isMasterDetail: boolean;
	showActionSheet: Function;
	// iOSScrollBehavior: number;
	// sharing: boolean;
	isActionsEnabled: boolean;
	// usedCannedResponse: string;
	// uploadFilePermission: string[];
	// goToCannedResponses: () => void | null;
	serverVersion: string;
}
