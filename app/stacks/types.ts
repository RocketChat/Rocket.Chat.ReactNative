import { type NavigatorScreenParams } from '@react-navigation/core';

import {
	type IAttachment,
	type ICannedResponse,
	type ILivechatDepartment,
	type ILivechatTag,
	type IMessage,
	type IServer,
	type ISubscription,
	type SubscriptionType,
	type TAnyMessageModel,
	type TChangeAvatarViewContext,
	type TDataSelect,
	type TMessageAction,
	type TSubscriptionModel,
	type TThreadModel,
	type IVisitor
} from '../definitions';
import { type CategoryViewParams } from '../views/CategoryView';
import { type CategorySettingsViewParams } from '../views/CategorySettingsView';
import { type ConfirmCategoryRoomsViewParams } from '../views/CategorySettingsView/ConfirmCategoryRoomsView';
import { type ManageCategoryRoomsViewParams } from '../views/CategorySettingsView/ManageCategoryRoomsView';
import { type RenameCategoryViewParams } from '../views/CategorySettingsView/RenameCategoryView';
import { type CreateCategoryViewParams } from '../views/CreateCategoryView';
import { type NewMessageViewParams } from '../views/NewMessageView';
import { type CategoryRoomsViewParams } from '../views/CreateCategoryView/CategoryRoomsView';
import { type ConfirmCategoryViewParams } from '../views/CreateCategoryView/ConfirmCategoryView';
import { type ModalStackParamList } from './MasterDetailStack/types';
import { type TNavigation } from './stackType';

// Hand-written rather than StaticParamList-inferred: views use composite navigation props spanning
// cross-stack destinations (ModalStackNavigator, E2E stacks), and explicit params avoid implicit `any`.
export type ChatsStackParamList = {
	ModalStackNavigator: NavigatorScreenParams<ModalStackParamList & TNavigation>;
	E2ESaveYourPasswordStackNavigator: NavigatorScreenParams<E2ESaveYourPasswordStackParamList>;
	E2EEnterYourPasswordStackNavigator: NavigatorScreenParams<E2EEnterYourPasswordStackParamList>;
	SettingsView: any;
	NewMessageStackNavigator: any;
	NewMessageStack: undefined;
	RoomsListView: undefined;
	CategoryView: CategoryViewParams;
	CategorySettingsView: CategorySettingsViewParams;
	ManageCategoryRoomsView: ManageCategoryRoomsViewParams;
	ConfirmCategoryRoomsView: ConfirmCategoryRoomsViewParams;
	RenameCategoryView: RenameCategoryViewParams;
	RoomView:
		| {
				rid: string;
				t: SubscriptionType;
				tmid?: string;
				messageId?: string;
				name?: string;
				fname?: string;
				prid?: string;
				visitor?: IVisitor;
				joinCodeRequired?: boolean;
				jumpToMessageId?: string;
				jumpToThreadId?: string;
				roomUserId?: string | null;
				usedCannedResponse?: string;
				status?: string;
		  }
		| undefined;
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
		fontHint?: string;
	};
	RoomInfoView: {
		room?: ISubscription;
		member?: any;
		rid: string;
		t: SubscriptionType;
		showCloseModal?: boolean;
		fromRid?: string;
		itsMe?: boolean;
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
	DisplayPrefsView: undefined;
	CategoryOrderView: undefined;
	E2EEToggleRoomView: {
		rid: string;
	};
	NotificationPrefView: {
		rid: string;
		room: TSubscriptionModel;
	};
	PushTroubleshootView: undefined;
	CloseLivechatView: {
		rid: string;
		departmentId?: string;
		departmentInfo?: ILivechatDepartment;
		tagsList?: ILivechatTag[];
	};
	LivechatEditView: {
		room: ISubscription;
		roomUser: any;
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
		isTeam?: boolean;
		teamId?: string;
		categoryId?: string;
	};
	AddChannelTeamView: {
		teamId: string;
		rid: string;
		t: 'c' | 'p';
	};
	AddExistingChannelView: {
		teamId: string;
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
	ReportUserView: {
		username: string;
		userId: string;
		name: string;
	};
};

export type ProfileStackParamList = {
	ProfileView: undefined;
	UserPreferencesView: undefined;
	UserNotificationPrefView: undefined;
	PushTroubleshootView: undefined;
	ChangeAvatarView: {
		context: TChangeAvatarViewContext;
		titleHeader?: string;
		room?: ISubscription;
		t?: SubscriptionType;
	};
	ChangePasswordView: undefined;
};

// Cross-stack entries (ProfileView, DisplayPrefsView, AccessibilityAndAppearanceView) are reachable
// from SettingsView via the drawer/accessibility stack.
export type SettingsStackParamList = {
	LegalView: undefined;
	SettingsView: undefined;
	SecurityPrivacyView: undefined;
	E2EEncryptionSecurityView: undefined;
	LanguageView: undefined;
	DefaultBrowserView: undefined;
	ScreenLockConfigView: undefined;
	ProfileView: undefined;
	DisplayPrefsView: undefined;
	CategoryOrderView: undefined;
	MediaAutoDownloadView: undefined;
	PushTroubleshootView: undefined;
	GetHelpView: undefined;
	AccessibilityAndAppearanceView: undefined;
};

export type AdminPanelStackParamList = {
	AdminPanelView: undefined;
};

export type AccessibilityStackParamList = {
	AccessibilityAndAppearanceView: undefined;
	DisplayPrefsView: undefined;
	CategoryOrderView: undefined;
	ThemeView: undefined;
};

export type DisplayPrefStackParamList = {
	DisplayPrefsView: undefined;
	CategoryOrderView: undefined;
};

export type DrawerParamList = {
	ChatsStackNavigator: NavigatorScreenParams<ChatsStackParamList>;
	ProfileStackNavigator: NavigatorScreenParams<ProfileStackParamList>;
	SettingsStackNavigator: NavigatorScreenParams<SettingsStackParamList>;
	AdminPanelStackNavigator: NavigatorScreenParams<AdminPanelStackParamList>;
	AccessibilityStackNavigator: NavigatorScreenParams<AccessibilityStackParamList>;
};

export type NewMessageStackParamList = {
	NewMessageView: NewMessageViewParams;
	SelectedUsersView: {
		maxUsers?: number;
		showButton?: boolean;
		title?: string;
		buttonText?: string;
		nextAction?: Function;
		showSkipText?: boolean;
	};
	CreateChannelView?: {
		isTeam?: boolean;
		teamId?: string;
		categoryId?: string;
	};
	CreateDiscussionView: {
		channel: ISubscription;
		message: IMessage;
		showCloseModal: boolean;
		categoryId?: string;
	};
	ForwardMessageView: {
		message: TAnyMessageModel;
	};
	CreateCategoryView: CreateCategoryViewParams;
	CategoryRoomsView: CategoryRoomsViewParams;
	ConfirmCategoryView: ConfirmCategoryViewParams;
};

export type E2ESaveYourPasswordStackParamList = {
	E2ESaveYourPasswordView: undefined;
	E2EHowItWorksView?: {
		showCloseModal?: boolean;
	};
};

export type E2EEnterYourPasswordStackParamList = {
	E2EEnterYourPasswordView: undefined;
	E2EEncryptionSecurityView: undefined;
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
		serverInfo: IServer;
		text: string;
		room: TSubscriptionModel;
		thread: TThreadModel | string;
		action: TMessageAction;
		finishShareView: (text?: string, selectedMessages?: string[]) => void | undefined;
		startShareView: () => { text: string; selectedMessages: string[] };
	};
	ModalBlockView: {
		data: any;
	};
	CallView: undefined;
};

export type { OutsideParamList, OutsideModalParamList } from './OutsideStack';
