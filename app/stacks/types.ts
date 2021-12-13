import { NavigatorScreenParams } from '@react-navigation/core';
import { TextInputProps } from 'react-native';
import Model from '@nozbe/watermelondb/Model';

import { IOptionsField } from '../views/NotificationPreferencesView/options';
import { IServer } from '../definitions/IServer';
import { IAttachment } from '../definitions/IAttachment';
import { IMessage } from '../definitions/IMessage';
import { IRoom, RoomType } from '../definitions/IRoom';

export type ChatsStackParamList = {
	RoomsListView: undefined;
	RoomView: {
		rid: string;
		t: RoomType;
		tmid?: string;
		message?: string;
		name?: string;
		fname?: string;
		prid?: string;
		room: IRoom;
		jumpToMessageId?: string;
		jumpToThreadId?: string;
		roomUserId?: string;
	};
	RoomActionsView: {
		room: IRoom;
		member: any;
		rid: string;
		t: RoomType;
		joined: boolean;
	};
	SelectListView: {
		data: any;
		title: string;
		infoText: string;
		nextAction: Function;
		showAlert: boolean;
		isSearch: boolean;
		onSearch: Function;
		isRadio?: boolean;
	};
	RoomInfoView: {
		room: IRoom;
		member: any;
		rid: string;
		t: RoomType;
	};
	RoomInfoEditView: {
		rid: string;
	};
	RoomMembersView: {
		rid: string;
		room: IRoom;
	};
	SearchMessagesView: {
		rid: string;
		t: RoomType;
		encrypted?: boolean;
		showCloseModal?: boolean;
	};
	SelectedUsersView: {
		maxUsers?: number;
		showButton?: boolean;
		title?: string;
		buttonText?: string;
		nextAction?: Function;
	};
	InviteUsersView: {
		rid: string;
	};
	InviteUsersEditView: {
		rid: string;
	};
	MessagesView: {
		rid: string;
		t: RoomType;
		name: string;
	};
	AutoTranslateView: {
		rid: string;
		room: IRoom;
	};
	DirectoryView: undefined;
	NotificationPrefView: {
		rid: string;
		room: Model;
	};
	ForwardLivechatView: {
		rid: string;
	};
	LivechatEditView: {
		room: IRoom;
		roomUser: any; // TODO: Change
	};
	PickerView: {
		title: string;
		data: IOptionsField[];
		value?: any; // TODO: Change
		onChangeText?: ((text: string) => IOptionsField[]) | ((term?: string) => Promise<any>);
		goBack?: boolean;
		onChangeValue: Function;
	};
	ThreadMessagesView: {
		rid: string;
		t: RoomType;
	};
	TeamChannelsView: {
		teamId: string;
	};
	CreateChannelView: {
		isTeam?: boolean; // TODO: To check
		teamId?: string;
	};
	AddChannelTeamView: {
		teamId?: string;
		teamChannels: []; // TODO: Change
	};
	AddExistingChannelView: {
		teamId?: string;
		teamChannels: []; // TODO: Change
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
		cannedResponse: {
			shortcut: string;
			text: string;
			scopeName: string;
			tags: string[];
		};
		room: IRoom;
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
	CreateChannelView: {
		isTeam?: boolean; // TODO: To check
		teamId?: string;
	};
	CreateDiscussionView: {
		channel: IRoom;
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
		room: IRoom;
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
	};
	LegalView: undefined;
};

export type OutsideModalParamList = {
	OutsideStack: NavigatorScreenParams<OutsideParamList>;
	AuthenticationWebView: {
		authType: string;
		url: string;
		ssoToken?: string;
	};
};
