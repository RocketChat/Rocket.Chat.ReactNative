import { TextInputProps } from 'react-native';
import { NavigatorScreenParams } from '@react-navigation/core';

import { IAttachment } from '../../definitions/IAttachment';
import { IMessage } from '../../definitions/IMessage';
import { IRoom, RoomType } from '../../definitions/IRoom';

export type ChatsStackParamList = {
	RoomView: undefined;
};

export type DrawerParamList = {
	ChatsStackNavigator: NavigatorScreenParams<ChatsStackParamList>;
};

export type ModalStackParamList = {
	RoomActionsView: {
		room: IRoom;
		member: any;
		rid: string;
		t: RoomType;
		joined: boolean;
	};
	RoomInfoView: {
		room: IRoom;
		member: any;
		rid: string;
		t: RoomType;
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
		teamChannels: []; // change
	};
	AddExistingChannelView: {
		teamId?: boolean;
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
	QueueListView: undefined;
	NotificationPrefView: {
		rid: string;
		room: IRoom;
	};
	VisitorNavigationView: {
		rid: string;
	};
	ForwardLivechatView: {
		rid: string;
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
		room: IRoom;
	};
	LivechatEditView: {
		room: IRoom;
		roomUser: any; // change
	};
	PickerView: {
		title: string;
		data: []; // change
		value: any; // change
		onChangeText: TextInputProps['onChangeText'];
		goBack: Function;
		onChangeValue: Function;
	};
	ThreadMessagesView: {
		rid: string;
		t: RoomType;
	};
	TeamChannelsView: {
		teamId: string;
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
	}; // to change
	CreateChannelView: {
		isTeam?: boolean; // to check
		teamId?: string;
	};
	CreateDiscussionView: {
		channel: IRoom;
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
	E2EEncryptionSecurityView: undefined;
};

export type InsideStackParamList = {
	DrawerNavigator: NavigatorScreenParams<DrawerParamList>;
	ModalStackNavigator: NavigatorScreenParams<ModalStackParamList>;
	AttachmentView: {
		attachment: IAttachment;
	};
	ModalBlockView: {
		data: any; // change;
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
		room: IRoom;
		thread: any; // change
	};
};
