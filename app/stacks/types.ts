import { NavigatorScreenParams } from '@react-navigation/core';

import { TThreadModel } from '../definitions';
import { IAttachment } from '../definitions/IAttachment';
import { ICannedResponse } from '../definitions/ICannedResponse';
import { TDataSelect } from '../definitions/IDataSelect';
import { ILivechatDepartment } from '../definitions/ILivechatDepartment';
import { ILivechatTag } from '../definitions/ILivechatTag';
import { IMessage, TAnyMessageModel, TMessageModel } from '../definitions/IMessage';
import { TServerModel } from '../definitions/IServer';
import { ISubscription, SubscriptionType, TSubscriptionModel } from '../definitions/ISubscription';
import { TChangeAvatarViewContext } from '../definitions/TChangeAvatarViewContext';
import { IItem } from '../views/TeamChannelsView';
import { MasterDetailInsideStackParamList, ModalStackParamList } from './MasterDetailStack/types';
import { TNavigation } from './stackType';

export type SetUsernameStackParamList = {
	SetUsernameView: {
		title: string;
	};
};

export type StackParamList = {
	AuthLoading: undefined;
	OutsideStack: NavigatorScreenParams<OutsideParamList>;
	InsideStack: NavigatorScreenParams<InsideStackParamList>;
	MasterDetailStack: NavigatorScreenParams<MasterDetailInsideStackParamList>;
	SetUsernameStack: NavigatorScreenParams<SetUsernameStackParamList>;
};

export type ChatsStackParamList = {
	ModalStackNavigator: NavigatorScreenParams<ModalStackParamList & TNavigation>;
	E2ESaveYourPasswordStackNavigator: NavigatorScreenParams<E2ESaveYourPasswordStackParamList>;
	E2EEnterYourPasswordStackNavigator: NavigatorScreenParams<E2EEnterYourPasswordStackParamList>;
	SettingsView: any;
	NewMessageStackNavigator: any;
	NewMessageStack: undefined;
	RoomsListView: undefined;
	RoomView:
		| {
				rid: string;
				t: SubscriptionType;
				tmid?: string;
				message?: TMessageModel;
				name?: string;
				fname?: string;
				prid?: string;
				room?: TSubscriptionModel | { rid: string; t: string; name?: string; fname?: string; prid?: string };
				jumpToMessageId?: string;
				jumpToThreadId?: string;
				roomUserId?: string | null;
				usedCannedResponse?: string;
				status?: string;
				replyInDM?: TAnyMessageModel;
		  }
		| undefined; // Navigates back to RoomView already on stack
	RoomActionsView: {
		room: TSubscriptionModel;
		member?: any;
		rid: string;
		t: SubscriptionType;
		joined: boolean;
		omnichannelPermissions?: {
			canForwardGuest: boolean;
			canReturnQueue: boolean;
			canViewCannedResponse: boolean;
			canPlaceLivechatOnHold: boolean;
		};
	};
	SelectListView: {
		data?: TDataSelect[];
		title: string;
		infoText?: string;
		nextAction: (selected: string[]) => void;
		showAlert?: () => void;
		isSearch?: boolean;
		onSearch?: (text: string) => Promise<TDataSelect[] | any>;
		isRadio?: boolean;
	};
	RoomInfoView: {
		room?: ISubscription;
		member?: any;
		rid: string;
		t: SubscriptionType;
		showCloseModal?: boolean;
		fromRid?: string;
	};
	RoomInfoEditView: {
		rid: string;
	};
	RoomMembersView: {
		rid: string;
		room: ISubscription;
		joined?: boolean;
	};
	DiscussionsView: {
		rid: string;
		t: SubscriptionType;
	};
	SearchMessagesView: {
		rid: string;
		t: SubscriptionType;
		encrypted?: boolean;
		showCloseModal?: boolean;
	};
	SelectedUsersView: {
		maxUsers?: number;
		showButton?: boolean;
		title?: string;
		buttonText?: string;
		showSkipText?: boolean;
		nextAction?(): void;
	};
	InviteUsersView: {
		rid: string;
	};
	InviteUsersEditView: {
		rid: string;
	};
	MessagesView: {
		rid: string;
		t: SubscriptionType;
		name: string;
	};
	AutoTranslateView: {
		rid: string;
		room: TSubscriptionModel;
	};
	DirectoryView: undefined;
	NotificationPrefView: {
		rid: string;
		room: TSubscriptionModel;
	};
	CloseLivechatView: {
		rid: string;
		departmentId?: string;
		departmentInfo?: ILivechatDepartment;
		tagsList?: ILivechatTag[];
	};
	LivechatEditView: {
		room: ISubscription;
		roomUser?: any; // TODO: Change
	};
	ThreadMessagesView: {
		rid: string;
		t: SubscriptionType;
	};
	TeamChannelsView: {
		teamId: string;
		joined: boolean;
	};
	CreateChannelView: {
		isTeam?: boolean; // TODO: To check
		teamId?: string;
	};
	AddChannelTeamView: {
		teamId?: string;
		teamChannels: IItem[];
	};
	AddExistingChannelView: {
		teamId?: string;
		teamChannels: IItem[];
	};
	MarkdownTableView: {
		renderRows: (drawExtraBorders?: boolean) => JSX.Element;
		tableWidth: number;
	};
	ReadReceiptsView: {
		messageId: string;
	};
	QueueListView: undefined;
	CannedResponsesListView: {
		rid: string;
	};
	CannedResponseDetail: {
		cannedResponse: ICannedResponse;
		room: ISubscription;
	};
	JitsiMeetView: {
		rid: string;
		url: string;
		onlyAudio?: boolean;
		videoConf?: boolean;
	};
	ChangeAvatarView: {
		context: TChangeAvatarViewContext;
		titleHeader?: string;
		room?: ISubscription;
		t?: SubscriptionType;
	};
};

export type ProfileStackParamList = {
	ProfileView: undefined;
	UserPreferencesView: undefined;
	UserNotificationPrefView: undefined;
	ChangeAvatarView: {
		context: TChangeAvatarViewContext;
		titleHeader?: string;
		room?: ISubscription;
		t?: SubscriptionType;
	};
};

export type SettingsStackParamList = {
	SettingsView: undefined;
	SecurityPrivacyView: undefined;
	E2EEncryptionSecurityView: undefined;
	LanguageView: undefined;
	ThemeView: undefined;
	DefaultBrowserView: undefined;
	ScreenLockConfigView: undefined;
	ProfileView: undefined;
	DisplayPrefsView: undefined;
};

export type AdminPanelStackParamList = {
	AdminPanelView: undefined;
};

export type DisplayPrefStackParamList = {
	DisplayPrefsView: undefined;
};

export type DrawerParamList = {
	ChatsStackNavigator: NavigatorScreenParams<ChatsStackParamList>;
	ProfileStackNavigator: NavigatorScreenParams<ProfileStackParamList>;
	SettingsStackNavigator: NavigatorScreenParams<SettingsStackParamList>;
	AdminPanelStackNavigator: NavigatorScreenParams<AdminPanelStackParamList>;
	DisplayPrefStackNavigator: NavigatorScreenParams<DisplayPrefStackParamList>;
};

export type NewMessageStackParamList = {
	NewMessageView: undefined;
	SelectedUsersViewCreateChannel: {
		maxUsers?: number;
		showButton?: boolean;
		title?: string;
		buttonText?: string;
		nextAction?: Function;
	}; // TODO: Change
	CreateChannelView?: {
		isTeam?: boolean; // TODO: To check
		teamId?: string;
	};
	CreateDiscussionView: {
		channel: ISubscription;
		message: IMessage;
		showCloseModal: boolean;
	};
};

export type E2ESaveYourPasswordStackParamList = {
	E2ESaveYourPasswordView: undefined;
	E2EHowItWorksView?: {
		showCloseModal?: boolean;
	};
};

export type E2EEnterYourPasswordStackParamList = {
	E2EEnterYourPasswordView?: undefined;
};

export type InsideStackParamList = {
	DrawerNavigator: NavigatorScreenParams<DrawerParamList>;
	NewMessageStackNavigator: NavigatorScreenParams<NewMessageStackParamList>;
	E2ESaveYourPasswordStackNavigator: NavigatorScreenParams<E2ESaveYourPasswordStackParamList>;
	E2EEnterYourPasswordStackNavigator: NavigatorScreenParams<E2EEnterYourPasswordStackParamList>;
	StatusView: undefined;
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		isShareExtension: boolean;
		serverInfo: TServerModel;
		text: string;
		room: TSubscriptionModel;
		thread?: TThreadModel;
		replying?: boolean;
		replyingMessage?: IMessage;
		closeReply?: Function;
	};
	ModalBlockView: {
		data: any; // TODO: Change;
	};
};

export type OutsideParamList = {
	NewServerView: undefined;
	WorkspaceView: undefined;
	LoginView: {
		title: string;
		username?: string;
	};
	ForgotPasswordView: {
		title: string;
	};
	SendEmailConfirmationView: {
		user?: string;
	};
	RegisterView: {
		title: string;
		username?: string;
	};
	LegalView: undefined;
	AuthenticationWebView: {
		authType: string;
		url: string;
		ssoToken?: string;
	};
};

export type OutsideModalParamList = {
	OutsideStack: NavigatorScreenParams<OutsideParamList>;
	AuthenticationWebView: {
		authType: string;
		url: string;
		ssoToken?: string;
	};
};
