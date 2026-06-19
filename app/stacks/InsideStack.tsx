import { useContext, type ComponentType } from 'react';
import { I18nManager } from 'react-native';
import {
	createNativeStackNavigator,
	createNativeStackScreen,
	type NativeStackNavigationOptions
} from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { type StaticParamList, type StaticScreenProps } from '@react-navigation/native';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
import withNavigation from '../lib/navigation/withNavigation';
import Sidebar from '../views/SidebarView';
import I18n from '../i18n';
import { isIOS } from '../lib/methods/helpers';
import { type TNavigation } from './stackType';
// Chats Stack
import RoomView from '../views/RoomView';
import RoomsListView from '../views/RoomsListView';
import RoomActionsView from '../views/RoomActionsView';
import RoomInfoView from '../views/RoomInfoView';
import ReportUserView from '../views/ReportUserView';
import RoomInfoEditView from '../views/RoomInfoEditView';
import RoomMembersView from '../views/RoomMembersView';
import SearchMessagesView from '../views/SearchMessagesView';
import SelectedUsersView from '../views/SelectedUsersView';
import InviteUsersView from '../views/InviteUsersView';
import InviteUsersEditView from '../views/InviteUsersEditView';
import MessagesView from '../views/MessagesView';
import AutoTranslateView from '../views/AutoTranslateView';
import DirectoryView from '../views/DirectoryView';
import NotificationPrefView from '../views/NotificationPreferencesView';
import E2EEToggleRoomView from '../views/E2EEToggleRoomView';
import ForwardLivechatView from '../views/ForwardLivechatView';
import CloseLivechatView from '../views/CloseLivechatView';
import LivechatEditView from '../views/LivechatEditView';
import PickerView from '../views/PickerView';
import ThreadMessagesView from '../views/ThreadMessagesView';
import TeamChannelsView from '../views/TeamChannelsView';
import ReadReceiptsView from '../views/ReadReceiptView';
import CannedResponsesListView from '../views/CannedResponsesListView';
import CannedResponseDetail from '../views/CannedResponseDetail';
import JitsiMeetView from '../views/JitsiMeetView';
import DiscussionsView from '../views/DiscussionsView';
import ChangeAvatarView from '../views/ChangeAvatarView';
import AddChannelTeamView from '../views/AddChannelTeamView';
import AddExistingChannelView from '../views/AddExistingChannelView';
import SelectListView from '../views/SelectListView';
import QueueListView from '../ee/omnichannel/views/QueueListView';
// Profile Stack
import ProfileView from '../views/ProfileView';
import UserPreferencesView from '../views/UserPreferencesView';
import UserNotificationPrefView from '../views/UserNotificationPreferencesView';
import ChangePasswordView from '../views/ChangePasswordView';
// Settings Stack
import SettingsView from '../views/SettingsView';
import SecurityPrivacyView from '../views/SecurityPrivacyView';
import GetHelpView from '../views/GetHelpView';
import PushTroubleshootView from '../views/PushTroubleshootView';
import E2EEncryptionSecurityView from '../views/E2EEncryptionSecurityView';
import LanguageView from '../views/LanguageView';
import DefaultBrowserView from '../views/DefaultBrowserView';
import ScreenLockConfigView from '../views/ScreenLockConfigView';
import MediaAutoDownloadView from '../views/MediaAutoDownloadView';
import LegalView from '../views/LegalView';
// Accessibility Stack
import AccessibilityAndAppearanceView from '../views/AccessibilityAndAppearanceView';
import DisplayPrefsView from '../views/DisplayPrefsView';
import ThemeView from '../views/ThemeView';
// Admin Stack
import AdminPanelView from '../views/AdminPanelView';
// NewMessage Stack
import NewMessageView from '../views/NewMessageView';
import CreateChannelView from '../views/CreateChannelView';
import CreateDiscussionView from '../views/CreateDiscussionView';
import ForwardMessageView from '../views/ForwardMessageView';
// E2E Stacks
import E2ESaveYourPasswordView from '../views/E2ESaveYourPasswordView';
import E2EHowItWorksView from '../views/E2EHowItWorksView';
import E2EEnterYourPasswordView from '../views/E2EEnterYourPasswordView';
// InsideStack top-level screens
import AttachmentView from '../views/AttachmentView';
import ModalBlockView from '../views/ModalBlockView';
import StatusView from '../views/StatusView';
import ShareView from '../views/ShareView';
import CallView from '../views/CallView';

// Cast through `any` to break the type cycle: StaticParamList<typeof Nav> ← these components ← Nav param lists.
// Use Record<string,any> (not `any`) so StaticParamList infers a concrete param type, not unknown/undefined.
const RoomViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(RoomView as any) as any;
const RoomActionsViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	RoomActionsView as any
) as any;
const SelectListViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(SelectListView as any) as any;
const RoomInfoEditViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	RoomInfoEditView as any
) as any;
const SearchMessagesViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	SearchMessagesView as any
) as any;
const InviteUsersViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	InviteUsersView as any
) as any;
const MessagesViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(MessagesView as any) as any;
const DirectoryViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(DirectoryView as any) as any;
const PushTroubleshootViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(
	PushTroubleshootView as any
) as any;
const LivechatEditViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	LivechatEditView as any
) as any;
const ThreadMessagesViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	ThreadMessagesView as any
) as any;
const TeamChannelsViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	TeamChannelsView as any
) as any;
const ReadReceiptsViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	ReadReceiptsView as any
) as any;
const CannedResponsesListViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	CannedResponsesListView as any
) as any;
const ProfileViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(ProfileView as any) as any;
const ChangePasswordViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(ChangePasswordView as any) as any;
const UserPreferencesViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(UserPreferencesView as any) as any;
const SecurityPrivacyViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(SecurityPrivacyView as any) as any;
const ScreenLockConfigViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(
	ScreenLockConfigView as any
) as any;
const CreateDiscussionViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(
	CreateDiscussionView as any
) as any;
const E2EEnterYourPasswordViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(
	E2EEnterYourPasswordView as any
) as any;
const ShareViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(ShareView as any) as any;
const ModalBlockViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = withNavigation(ModalBlockView as any) as any;

// Bare screens with params: Record<string,any> so StaticParamList infers concrete param type, not unknown/undefined.
const RoomInfoViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = RoomInfoView as any;
const ReportUserViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = ReportUserView as any;
const RoomMembersViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = RoomMembersView as any;
const DiscussionsViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = DiscussionsView as any;
const SelectedUsersViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = SelectedUsersView as any;
const InviteUsersEditViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = InviteUsersEditView as any;
const AutoTranslateViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = AutoTranslateView as any;
const NotificationPrefViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = NotificationPrefView as any;
const E2EEToggleRoomViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = E2EEToggleRoomView as any;
const CloseLivechatViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = CloseLivechatView as any;
const CreateChannelViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = CreateChannelView as any;
const AddChannelTeamViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = AddChannelTeamView as any;
const AddExistingChannelViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = AddExistingChannelView as any;
const CannedResponseDetailScreen: ComponentType<StaticScreenProps<Record<string, any>>> = CannedResponseDetail as any;
const JitsiMeetViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = JitsiMeetView as any;
const ChangeAvatarViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = ChangeAvatarView as any;
const UserNotificationPrefViewScreen: ComponentType<StaticScreenProps<undefined>> = UserNotificationPrefView as any;
const SettingsViewScreen: ComponentType<StaticScreenProps<undefined>> = SettingsView as any;
const E2EEncryptionSecurityViewScreen: ComponentType<StaticScreenProps<undefined>> = E2EEncryptionSecurityView as any;
const LanguageViewScreen: ComponentType<StaticScreenProps<undefined>> = LanguageView as any;
const DefaultBrowserViewScreen: ComponentType<StaticScreenProps<undefined>> = DefaultBrowserView as any;
const MediaAutoDownloadViewScreen: ComponentType<StaticScreenProps<undefined>> = MediaAutoDownloadView as any;
const GetHelpViewScreen: ComponentType<StaticScreenProps<undefined>> = GetHelpView as any;
const LegalViewScreen: ComponentType<StaticScreenProps<undefined>> = LegalView as any;
const AccessibilityAndAppearanceViewScreen: ComponentType<StaticScreenProps<undefined>> = AccessibilityAndAppearanceView as any;
const DisplayPrefsViewScreen: ComponentType<StaticScreenProps<undefined>> = DisplayPrefsView as any;
const ThemeViewScreen: ComponentType<StaticScreenProps<undefined>> = ThemeView as any;
const AdminPanelViewScreen: ComponentType<StaticScreenProps<undefined>> = AdminPanelView as any;
const NewMessageViewScreen: ComponentType<StaticScreenProps<undefined>> = NewMessageView as any;
const ForwardMessageViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = ForwardMessageView as any;
const E2ESaveYourPasswordViewScreen: ComponentType<StaticScreenProps<undefined>> = E2ESaveYourPasswordView as any;
const E2EHowItWorksViewScreen: ComponentType<StaticScreenProps<Record<string, any>>> = E2EHowItWorksView as any;
const StatusViewScreen: ComponentType<StaticScreenProps<undefined>> = StatusView as any;
const CallViewScreen: ComponentType<StaticScreenProps<undefined>> = CallView as any;
const QueueListViewScreen: ComponentType<StaticScreenProps<undefined>> = QueueListView as any;

// Explicit param-type annotations so StaticParamList preserves the TNavigation screen types.
const PickerViewScreen: ComponentType<StaticScreenProps<TNavigation['PickerView']>> = PickerView as any;
const ForwardLivechatViewScreen: ComponentType<StaticScreenProps<TNavigation['ForwardLivechatView']>> =
	ForwardLivechatView as any;
const AttachmentViewScreen: ComponentType<StaticScreenProps<TNavigation['AttachmentView']>> = AttachmentView as any;

const ChatsStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		RoomsListView,
		RoomView: RoomViewScreen,
		RoomActionsView: createNativeStackScreen({
			screen: RoomActionsViewScreen,
			options: { title: I18n.t('Actions') }
		}),
		SelectListView: SelectListViewScreen,
		RoomInfoView: RoomInfoViewScreen,
		ReportUserView: ReportUserViewScreen,
		RoomInfoEditView: RoomInfoEditViewScreen,
		ChangeAvatarView: ChangeAvatarViewScreen,
		RoomMembersView: RoomMembersViewScreen,
		DiscussionsView: DiscussionsViewScreen,
		SearchMessagesView: createNativeStackScreen({
			screen: SearchMessagesViewScreen,
			options: (args: any): NativeStackNavigationOptions => (SearchMessagesView as any).navigationOptions(args)
		}),
		SelectedUsersView: SelectedUsersViewScreen,
		InviteUsersView: InviteUsersViewScreen,
		InviteUsersEditView: InviteUsersEditViewScreen,
		MessagesView: MessagesViewScreen,
		AutoTranslateView: AutoTranslateViewScreen,
		DirectoryView: DirectoryViewScreen,
		NotificationPrefView: NotificationPrefViewScreen,
		E2EEToggleRoomView: E2EEToggleRoomViewScreen,
		PushTroubleshootView: PushTroubleshootViewScreen,
		ForwardLivechatView: ForwardLivechatViewScreen,
		CloseLivechatView: CloseLivechatViewScreen,
		LivechatEditView: LivechatEditViewScreen,
		PickerView: PickerViewScreen,
		ThreadMessagesView: ThreadMessagesViewScreen,
		TeamChannelsView: TeamChannelsViewScreen,
		CreateChannelView: CreateChannelViewScreen,
		AddChannelTeamView: AddChannelTeamViewScreen,
		AddExistingChannelView: AddExistingChannelViewScreen,
		ReadReceiptsView: createNativeStackScreen({
			screen: ReadReceiptsViewScreen,
			options: { title: I18n.t('Read_Receipt') }
		}),
		QueueListView: QueueListViewScreen,
		CannedResponsesListView: CannedResponsesListViewScreen,
		CannedResponseDetail: CannedResponseDetailScreen,
		JitsiMeetView: createNativeStackScreen({
			screen: JitsiMeetViewScreen,
			options: { headerShown: false, animation: isIOS ? 'default' : 'none' }
		})
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const ProfileStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		ProfileView: ProfileViewScreen,
		ChangePasswordView: ChangePasswordViewScreen,
		UserPreferencesView: UserPreferencesViewScreen,
		ChangeAvatarView: ChangeAvatarViewScreen,
		UserNotificationPrefView: UserNotificationPrefViewScreen,
		PushTroubleshootView: PushTroubleshootViewScreen,
		PickerView: PickerViewScreen
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const SettingsStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		SettingsView: SettingsViewScreen,
		SecurityPrivacyView: SecurityPrivacyViewScreen,
		PushTroubleshootView: PushTroubleshootViewScreen,
		E2EEncryptionSecurityView: E2EEncryptionSecurityViewScreen,
		LanguageView: LanguageViewScreen,
		DefaultBrowserView: DefaultBrowserViewScreen,
		MediaAutoDownloadView: MediaAutoDownloadViewScreen,
		GetHelpView: GetHelpViewScreen,
		LegalView: LegalViewScreen,
		ScreenLockConfigView: createNativeStackScreen({
			screen: ScreenLockConfigViewScreen,
			options: { title: I18n.t('Screen_lock') }
		})
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const AdminPanelStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		AdminPanelView: AdminPanelViewScreen
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const AccessibilityStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		AccessibilityAndAppearanceView: AccessibilityAndAppearanceViewScreen,
		DisplayPrefsView: DisplayPrefsViewScreen,
		ThemeView: ThemeViewScreen
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const DrawerStack = createDrawerNavigator({
	screenOptions: {
		swipeEnabled: false,
		headerShown: false,
		drawerPosition: I18nManager.isRTL ? 'right' : 'left',
		drawerType: 'slide',
		freezeOnBlur: true
	},
	screens: {
		ChatsStackNavigator: ChatsStack,
		ProfileStackNavigator: ProfileStack,
		SettingsStackNavigator: SettingsStack,
		AdminPanelStackNavigator: AdminPanelStack,
		AccessibilityStackNavigator: AccessibilityStack
	}
}).with(({ Navigator }) => {
	'use memo';

	const { colors } = useContext(ThemeContext);
	return (
		<Navigator
			drawerContent={({ navigation }) => <Sidebar navigation={navigation as any} />}
			screenOptions={{ overlayColor: `rgba(0,0,0,${colors.backdropOpacity})` }}
		/>
	);
});

const NewMessageStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		NewMessageView: NewMessageViewScreen,
		SelectedUsersView: SelectedUsersViewScreen,
		CreateChannelView: CreateChannelViewScreen,
		CreateDiscussionView: CreateDiscussionViewScreen,
		ForwardMessageView: ForwardMessageViewScreen
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const E2ESaveYourPasswordStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		E2ESaveYourPasswordView: E2ESaveYourPasswordViewScreen,
		E2EHowItWorksView: E2EHowItWorksViewScreen
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const E2EEnterYourPasswordStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		E2EEnterYourPasswordView: E2EEnterYourPasswordViewScreen,
		E2EEncryptionSecurityView: E2EEncryptionSecurityViewScreen
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const InsideStack = createNativeStackNavigator({
	screenOptions: { ...defaultHeader, presentation: 'containedModal' },
	screens: {
		DrawerNavigator: createNativeStackScreen({
			screen: DrawerStack,
			options: { headerShown: false }
		}),
		NewMessageStackNavigator: createNativeStackScreen({
			screen: NewMessageStack,
			options: { headerShown: false }
		}),
		E2ESaveYourPasswordStackNavigator: createNativeStackScreen({
			screen: E2ESaveYourPasswordStack,
			options: { headerShown: false }
		}),
		E2EEnterYourPasswordStackNavigator: createNativeStackScreen({
			screen: E2EEnterYourPasswordStack,
			options: { headerShown: false }
		}),
		AttachmentView: AttachmentViewScreen,
		StatusView: StatusViewScreen,
		ShareView: ShareViewScreen,
		ModalBlockView: createNativeStackScreen({
			screen: ModalBlockViewScreen,
			options: (args: any): NativeStackNavigationOptions => (ModalBlockView as any).navigationOptions(args)
		}),
		CallView: createNativeStackScreen({
			screen: CallViewScreen,
			options: { headerShown: false }
		})
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

export type ChatsStackParamList = StaticParamList<typeof ChatsStack>;
export type ProfileStackParamList = StaticParamList<typeof ProfileStack>;
export type SettingsStackParamList = StaticParamList<typeof SettingsStack>;
export type AdminPanelStackParamList = StaticParamList<typeof AdminPanelStack>;
export type AccessibilityStackParamList = StaticParamList<typeof AccessibilityStack>;
export type DrawerParamList = StaticParamList<typeof DrawerStack>;
export type NewMessageStackParamList = StaticParamList<typeof NewMessageStack>;
export type E2ESaveYourPasswordStackParamList = StaticParamList<typeof E2ESaveYourPasswordStack>;
export type E2EEnterYourPasswordStackParamList = StaticParamList<typeof E2EEnterYourPasswordStack>;
export type InsideStackParamList = StaticParamList<typeof InsideStack>;

const InsideStackScreen = InsideStack.getComponent();

export default InsideStackScreen;
