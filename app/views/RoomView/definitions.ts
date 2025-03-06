import { EdgeInsets } from 'react-native-safe-area-context';

import { ChatsStackParamList } from '../../stacks/types';
import { IBaseScreen, ILastMessage, ILoggedUser, TSubscriptionModel, ICustomEmojis, TMessageAction } from '../../definitions';
import { IActionSheetProvider } from '../../containers/ActionSheet';

export interface IRoomViewProps extends IActionSheetProvider, IBaseScreen<ChatsStackParamList, 'RoomView'> {
	user: Pick<ILoggedUser, 'id' | 'username' | 'token' | 'showMessageInMainThread'>;
	useRealName?: boolean;
	isAuthenticated: boolean;
	Message_GroupingPeriod?: number;
	Message_TimeFormat?: string;
	Message_Read_Receipt_Enabled?: boolean;
	Hide_System_Messages?: string[];
	baseUrl: string;
	serverVersion: string | null;
	customEmojis: ICustomEmojis;
	isMasterDetail: boolean;
	replyBroadcast: Function;
	width: number;
	insets: EdgeInsets;
	transferLivechatGuestPermission?: string[]; // TODO: Check if its the correct type
	viewCannedResponsesPermission?: string[]; // TODO: Check if its the correct type
	livechatAllowManualOnHold?: boolean;
	inAppFeedback?: { [key: string]: string };
	encryptionEnabled: boolean;
	airGappedRestrictionRemainingDays: number | undefined;
}

export type TStateAttrsUpdate = keyof IRoomViewState;
export type TRoomUpdate = keyof TSubscriptionModel;

export interface IRoomViewState {
	[key: string]: any;
	joined: boolean;
	room:
		| TSubscriptionModel
		| {
				rid: string;
				t: string;
				name?: string;
				fname?: string;
				prid?: string;
				joinCodeRequired?: boolean;
				status?: string;
				lastMessage?: ILastMessage;
				sysMes?: boolean;
				onHold?: boolean;
		  };
	roomUpdate: {
		[K in TRoomUpdate]?: any;
	};
	member: any;
	lastOpen: Date | null;
	reactionsModalVisible: boolean;
	canAutoTranslate: boolean;
	loading: boolean;
	replyWithMention: boolean;
	readOnly: boolean;
	unreadsCount: number | null;
	roomUserId?: string | null;
	action: TMessageAction;
	selectedMessages: string[];
}
