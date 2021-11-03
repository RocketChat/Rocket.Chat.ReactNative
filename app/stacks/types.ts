import { TextInputProps } from 'react-native';

import { IAttachment } from '../definition/IAttachment';
import { IMessage } from '../definition/IMessage';
import { IRoom, RoomType } from '../definition/IRoom';

export type ChatsStackParamList = {
	RoomsListView: undefined;
	RoomView: {
		rid: string;
		t: RoomType;
		tmid?: string;
		message?: string;
		name: string;
		fname: string;
		prid?: string;
		room: IRoom;
		jumpToMessageId?: string;
		jumpToThreadId?: string;
		roomUserId: string;
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
		maxUsers: number;
		showButton: boolean;
		title: string;
		buttonText: string;
		nextAction: Function;
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
		room: IRoom;
	};
	VisitorNavigationView: {
		rid: string;
	};
	ForwardLivechatView: {
		rid: string;
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
	CreateChannelView: {
		isTeam?: boolean; // to check
		teamId?: string;
	};
	AddChannelTeamView: {
		teamId?: string;
		teamChannels: []; // change
	};
	AddExistingChannelView: {
		teamId?: boolean;
	};
	MarkdownTableView: {
		renderRows: Function;
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
		data: []; // change
		value: any; // change
		onChangeText: TextInputProps['onChangeText'];
		goBack: Function;
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
};

export type AdminPanelStackParamList = {
	AdminPanelView: undefined;
};

export type DisplayPrefStackParamList = {
	DisplayPrefsView: undefined;
};

export type DrawerParamList = {
	ChatsStackNavigator: ChatsStackParamList;
	ProfileStackNavigator: ProfileStackParamList;
	SettingsStackNavigator: SettingsStackParamList;
	AdminPanelStackNavigator: AdminPanelStackParamList;
	DisplayPrefStackNavigator: DisplayPrefStackParamList;
};

export type NewMessageStackParamList = {
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
};

export type E2ESaveYourPasswordStackParamList = {
	E2ESaveYourPasswordView: undefined;
	E2EHowItWorksView: {
		showCloseModal: boolean;
	};
};

export type E2EEnterYourPasswordStackParamList = {
	E2EEnterYourPasswordView: undefined;
};

export type InsideStackParamList = {
	DrawerNavigator: DrawerParamList;
	NewMessageStackNavigator: NewMessageStackParamList;
	E2ESaveYourPasswordStackNavigator: E2ESaveYourPasswordStackParamList;
	E2EEnterYourPasswordStackNavigator: E2EEnterYourPasswordStackParamList;
	AttachmentView: {
		attachment: IAttachment;
	};
	StatusView: undefined;
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		serverInfo: {};
		text: string;
		room: IRoom;
		thread: any; // change
	};
	ModalBlockView: {
		data: any; // change;
	};
	JitsiMeetView: {
		rid: string;
		url: string;
		onlyAudio?: boolean;
	};
};
