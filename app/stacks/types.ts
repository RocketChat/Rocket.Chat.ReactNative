import { NavigatorScreenParams } from '@react-navigation/core';
import { TextInputProps } from 'react-native';

import { IItem } from '../views/TeamChannelsView';
import { IOptionsField } from '../views/NotificationPreferencesView/options';
import { IServer } from '../definitions/IServer';
import { IAttachment } from '../definitions/IAttachment';
import { IMessage, TMessageModel } from '../definitions/IMessage';
import { ISubscription, SubscriptionType, TSubscriptionModel } from '../definitions/ISubscription';
import { ICannedResponse } from '../definitions/ICannedResponse';
import { TDataSelect } from '../definitions/IDataSelect';
import { ModalStackParamList } from './MasterDetailStack/types';

export type ChatsStackParamList = {
	ModalStackNavigator: NavigatorScreenParams<ModalStackParamList>;
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
		  }
		| undefined; // Navigates back to RoomView already on stack
	RoomActionsView: {
		room: TSubscriptionModel;
		member?: any;
		rid: string;
		t: SubscriptionType;
		joined: boolean;
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
	};
	RoomInfoEditView: {
		rid: string;
	};
	RoomMembersView: {
		rid: string;
		room: ISubscription;
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
	ForwardLivechatView: {
		rid: string;
	};
	LivechatEditView: {
		room: ISubscription;
		roomUser: any; // TODO: Change
	};
	PickerView: {
		title: string;
		data: IOptionsField[];
		value?: string;
		onSearch?: (text?: string) => Promise<any>;
		onEndReached?: (text: string, offset?: number) => Promise<any>;
		total?: number;
		goBack?: boolean;
		onChangeValue: Function;
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
};

export type ProfileStackParamList = {
	ProfileView: undefined;
	UserPreferencesView: undefined;
	UserNotificationPrefView: undefined;
	PickerView: {
		title: string;
		data: IOptionsField[];
		value: any; // TODO: Change
		onChangeText?: TextInputProps['onChangeText'];
		goBack?: Function;
		onChangeValue: Function;
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
	E2EEnterYourPasswordView: undefined;
};

export type InsideStackParamList = {
	DrawerNavigator: NavigatorScreenParams<DrawerParamList>;
	NewMessageStackNavigator: NavigatorScreenParams<NewMessageStackParamList>;
	E2ESaveYourPasswordStackNavigator: NavigatorScreenParams<E2ESaveYourPasswordStackParamList>;
	E2EEnterYourPasswordStackNavigator: NavigatorScreenParams<E2EEnterYourPasswordStackParamList>;
	AttachmentView: {
		attachment: IAttachment;
	};
	StatusView: undefined;
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		isShareExtension: boolean;
		serverInfo: IServer;
		text: string;
		room: TSubscriptionModel;
		thread: any; // TODO: Change
	};
	ModalBlockView: {
		data: any; // TODO: Change;
	};
	JitsiMeetView: {
		rid: string;
		url: string;
		onlyAudio?: boolean;
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
