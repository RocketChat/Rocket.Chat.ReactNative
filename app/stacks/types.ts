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
	AutoTranslateView: {};
	DirectoryView: {};
	NotificationPrefView: {};
	VisitorNavigationView: {};
	ForwardLivechatView: {};
	LivechatEditView: {};
	PickerView: {};
	ThreadMessagesView: {};
	TeamChannelsView: {};
	CreateChannelView: {};
	AddChannelTeamView: {};
	AddExistingChannelView: {};
	MarkdownTableView: {};
	ReadReceiptsView: {};
	QueueListView: {};
	CannedResponsesListView: {};
	CannedResponseDetail: {};
};

export type ProfileStackParamList = {
	ProfileView: {};
	UserPreferencesView: {};
	UserNotificationPrefView: {};
	PickerView: {};
};

export type SettingsStackParamList = {
	SettingsView: {};
	SecurityPrivacyView: {};
	E2EEncryptionSecurityView: {};
	LanguageView: {};
	ThemeView: {};
	DefaultBrowserView: {};
	ScreenLockConfigView: {};
};

export type AdminPanelStackParamList = {
	AdminPanelView: {};
};

export type DisplayPrefStackParamList = {
	DisplayPrefsView: {};
};

export type DrawerParamList = {
	ChatsStackNavigator: ChatsStackParamList;
	ProfileStackNavigator: ProfileStackParamList;
	SettingsStackNavigator: SettingsStackParamList;
	AdminPanelStackNavigator: AdminPanelStackParamList;
	DisplayPrefStackNavigator: DisplayPrefStackParamList;
};

export type NewMessageStackParamList = {
	NewMessageView: {};
	SelectedUsersViewCreateChannel: {}; // to change
	CreateChannelView: {};
	CreateDiscussionView: {};
};

export type E2ESaveYourPasswordStackParamList = {
	E2ESaveYourPasswordView: {};
	E2EHowItWorksView: {};
};

export type E2EEnterYourPasswordStackParamList = {
	E2EEnterYourPasswordView: {};
};

export type InsideStackParamList = {
	DrawerNavigator: DrawerParamList;
	NewMessageStackNavigator: NewMessageStackParamList;
	E2ESaveYourPasswordStackNavigator: E2ESaveYourPasswordStackParamList;
	E2EEnterYourPasswordStackNavigator: E2EEnterYourPasswordStackParamList;
	AttachmentView: {};
	StatusView: {};
	ShareView: {};
	ModalBlockView: {};
	JitsiMeetView: {};
};
