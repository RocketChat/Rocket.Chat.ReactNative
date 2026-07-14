import { type EdgeInsets } from 'react-native-safe-area-context';

import { type ChatsStackParamList } from '../../stacks/types';
import {
	type IBaseScreen,
	type ILastMessage,
	type ILoggedUser,
	type IMessage,
	type IMessageEditAttachment,
	type IVisitor,
	type TSubscriptionModel
} from '../../definitions';
import { type IActionSheetProvider } from '../../containers/ActionSheet';

export interface IRoomViewProps extends IActionSheetProvider, IBaseScreen<ChatsStackParamList, 'RoomView'> {
	user: Pick<ILoggedUser, 'id' | 'username' | 'token' | 'showMessageInMainThread'>;
	isAuthenticated: boolean;
	Message_GroupingPeriod?: number;
	Message_Read_Receipt_Enabled?: boolean;
	Hide_System_Messages?: string[];
	baseUrl: string;
	serverVersion: string | null;
	isMasterDetail: boolean;
	replyBroadcast: Function;
	width: number;
	insets: EdgeInsets;
	transferLivechatGuestPermission?: string[]; // TODO: Check if its the correct type
	viewCannedResponsesPermission?: string[]; // TODO: Check if its the correct type
	livechatAllowManualOnHold?: boolean;
	encryptionEnabled: boolean;
	airGappedRestrictionRemainingDays: number | undefined;
	isFederationEnabled: boolean;
	isFederationModuleEnabled: boolean;
}

export type TStateAttrsUpdate = keyof IRoomViewState;
export type TRoomUpdate = keyof TSubscriptionModel;

export interface IRoomViewState {
	joined: boolean;
	room:
		| TSubscriptionModel
		| {
				rid: string;
				t: string;
				name?: string;
				fname?: string;
				prid?: string;
				visitor?: IVisitor;
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
	canAutoTranslate: boolean;
	loading: boolean;
	readOnly: boolean;
	unreadsCount: number | null;
	roomUserId?: string | null;
	isAutocompleteVisible: boolean;
	showMissingE2EEKey: boolean;
	showE2EEDisabledRoom: boolean;
	canForwardGuest: boolean;
	canReturnQueue: boolean;
	canViewCannedResponse: boolean;
	canPlaceLivechatOnHold: boolean;
}

export type ComposerState = {
	rid?: string;
	t?: string;
	tmid?: string;
	room: IRoomViewState['room'];
	roomUpdate?: IRoomViewState['roomUpdate'];
	sharing?: boolean;
	isAutocompleteVisible: boolean;
	editCancel?: () => void;
	editRequest?: (message: Pick<IMessage, 'id' | 'msg' | 'rid'> & { attachments?: IMessageEditAttachment[] }) => Promise<void>;
	onRemoveQuoteMessage?: (messageId: string) => void;
	onSendMessage?: (message?: string, tshow?: boolean) => void;
	setQuotesAndText?: (text: string, quotes: string[]) => void;
	getText?: () => string | undefined;
	updateAutocompleteVisible: (updatedAutocompleteVisible: boolean) => void;
};

// The externally-suppliable slice of ComposerState — `isAutocompleteVisible`/`updateAutocompleteVisible`
// are store-owned (seeded internally by `createComposerStore`), not passed in by callers.
export type TComposerExternalState = Omit<ComposerState, 'isAutocompleteVisible' | 'updateAutocompleteVisible'>;

export interface IUseE2EEStatusResult {
	showMissingE2EEKey: boolean;
	showE2EEDisabledRoom: boolean;
}
