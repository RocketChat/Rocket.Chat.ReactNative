import { TextInputProps } from 'react-native';
import { NavigatorScreenParams } from '@react-navigation/core';

import { IAttachment } from '../../definitions/IAttachment';
import { IMessage } from '../../definitions/IMessage';
import { ISubscription, SubscriptionType } from '../../definitions/ISubscription';

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
		member: any;
		rid: string;
		t: SubscriptionType;
		joined: boolean;
	};
	RoomInfoView: {
		room: ISubscription;
		member: any;
		rid: string;
		t: SubscriptionType;
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
		room: ISubscription;
	};
	DiscussionsView: undefined;
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
		room: ISubscription;
	};
	LivechatEditView: {
		room: ISubscription;
		roomUser: any; // TODO: Change
	};
	PickerView: {
		title: string;
		data: []; // TODO: Change
		value: any; // TODO: Change
		onChangeText: TextInputProps['onChangeText'];
		goBack: Function;
		onChangeValue: Function;
	};
	ThreadMessagesView: {
		rid: string;
		t: SubscriptionType;
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
	E2EEncryptionSecurityView: undefined;
};

export type MasterDetailInsideStackParamList = {
	DrawerNavigator: NavigatorScreenParams<Partial<MasterDetailDrawerParamList>>; // TODO: Change
	ModalStackNavigator: NavigatorScreenParams<ModalStackParamList>;
	AttachmentView: {
		attachment: IAttachment;
	};
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
