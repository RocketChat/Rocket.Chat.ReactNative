import { NavigatorScreenParams } from '@react-navigation/core';

import { IAttachment } from '../../definitions/IAttachment';
import { ILivechatDepartment } from '../../definitions/ILivechatDepartment';
import { ILivechatTag } from '../../definitions/ILivechatTag';
import { IMessage, TAnyMessageModel } from '../../definitions/IMessage';
import { ISubscription, SubscriptionType, TSubscriptionModel } from '../../definitions/ISubscription';
import { TChangeAvatarViewContext } from '../../definitions/TChangeAvatarViewContext';

export type MasterDetailChatsStackParamList = {
	RoomView: {
		rid: string;
		t: SubscriptionType;
		tmid?: string;
		message?: string;
		name?: string;
		fname?: string;
		prid?: string;
		room: ISubscription;
		jumpToMessageId?: string;
		jumpToThreadId?: string;
		roomUserId?: string;
	};
};

export type MasterDetailDrawerParamList = {
	ChatsStackNavigator: NavigatorScreenParams<MasterDetailChatsStackParamList>;
};

export type ModalStackParamList = {
	RoomActionsView: {
		room: ISubscription;
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
	RoomInfoView: {
		room: ISubscription;
		member: any;
		rid: string;
		t: SubscriptionType;
		showCloseModal?: boolean;
	};
	SelectListView: {
		data: any;
		title: string;
		infoText: string;
		nextAction: Function;
		showAlert?: () => void | boolean;
		isSearch?: boolean;
		onSearch?: Function;
		isRadio?: boolean;
	};
	ChangeAvatarView: {
		context: TChangeAvatarViewContext;
		titleHeader?: string;
		room?: ISubscription;
		t?: SubscriptionType;
	};
	RoomInfoEditView: {
		rid: string;
	};
	RoomMembersView: {
		rid: string;
		room: TSubscriptionModel;
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
		maxUsers: number;
		showButton: boolean;
		title: string;
		buttonText: string;
		nextAction: Function;
	};
	InviteUsersView: {
		rid: string;
	};
	AddChannelTeamView: {
		teamId?: string;
		teamChannels: []; // TODO: Change
	};
	AddExistingChannelView: {
		teamId?: boolean;
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
		room: ISubscription;
	};
	DirectoryView: undefined;
	QueueListView: undefined;
	NotificationPrefView: {
		rid: string;
		room: ISubscription;
	};
	E2EEToggleRoomView: {
		rid: string;
	};
	ForwardMessageView: {
		message: TAnyMessageModel;
	};
	ForwardLivechatView: {
		rid: string;
	};
	CloseLivechatView: {
		rid: string;
		departmentId?: string;
		departmentInfo?: ILivechatDepartment;
		tagsList?: ILivechatTag[];
	};
	CannedResponsesListView: {
		rid: string;
	};
	CannedResponseDetail: {
		cannedResponse: {
			shortcut: string;
			text: string;
			scopeName: string;
			tags: string[];
		};
		room: ISubscription;
	};
	LivechatEditView: {
		room: ISubscription;
		roomUser: any; // TODO: Change
	};
	ThreadMessagesView: {
		rid: string;
		t: SubscriptionType;
	};
	TeamChannelsView: {
		teamId: string;
		joined: boolean;
	};
	MarkdownTableView: {
		renderRows: Function;
		tableWidth: number;
	};
	ReadReceiptsView: {
		messageId: string;
	};
	SettingsView: undefined;
	LanguageView: undefined;
	ThemeView: undefined;
	DefaultBrowserView: undefined;
	ScreenLockConfigView: undefined;
	StatusView: undefined;
	ProfileView: undefined;
	DisplayPrefsView: undefined;
	AdminPanelView: undefined;
	NewMessageView: undefined;
	SelectedUsersViewCreateChannel: {
		maxUsers: number;
		showButton: boolean;
		title: string;
		buttonText: string;
		nextAction: Function;
	}; // TODO: Change
	CreateChannelView: {
		isTeam?: boolean; // TODO: To check
		teamId?: string;
	};
	CreateDiscussionView: {
		channel: ISubscription;
		message: IMessage;
		showCloseModal: boolean;
	};
	E2ESaveYourPasswordView: undefined;
	E2EHowItWorksView: {
		showCloseModal: boolean;
	};
	E2EEnterYourPasswordView: undefined;
	UserPreferencesView: undefined;
	UserNotificationPrefView: undefined;
	SecurityPrivacyView: undefined;
	MediaAutoDownloadView: undefined;
	E2EEncryptionSecurityView: undefined;
	PushTroubleshootView: undefined;
	LegalView: undefined;
	SupportedVersionsWarning: {
		showCloseButton?: boolean;
	};
	ReportUserView: {
		username: string;
		userId: string;
		name: string;
	};
};

export type MasterDetailInsideStackParamList = {
	DrawerNavigator: NavigatorScreenParams<Partial<MasterDetailDrawerParamList>>; // TODO: Change
	ModalStackNavigator: NavigatorScreenParams<ModalStackParamList>;
	ModalBlockView: {
		data: any; // TODO: Change
	};
	JitsiMeetView: {
		rid: string;
		url: string;
		onlyAudio?: boolean;
	};
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		serverInfo: {};
		text: string;
		room: ISubscription;
		thread: any; // TODO: Change
	};
};
