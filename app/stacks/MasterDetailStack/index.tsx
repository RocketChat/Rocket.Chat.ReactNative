import { useContext, type ComponentType } from 'react';
import {
	createNativeStackNavigator,
	createNativeStackScreen,
	type NativeStackNavigationProp
} from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { type StaticScreenProps, useNavigation } from '@react-navigation/native';

import { ThemeContext } from '../../theme';
import { defaultHeader, themedHeader, drawerStyle } from '../../lib/methods/helpers/navigation';
import withNavigation from '../../lib/navigation/withNavigation';
import { isIOS } from '../../lib/methods/helpers';
import { ModalContainer } from './ModalContainer';
import { type MasterDetailChatsStackParamList, type MasterDetailInsideStackParamList, type ModalStackParamList } from './types';
// Chats Stack
import RoomView from '../../views/RoomView';
import RoomsListView from '../../views/RoomsListView';
// Modal Stack
import RoomActionsView from '../../views/RoomActionsView';
import RoomInfoView from '../../views/RoomInfoView';
import ReportUserView from '../../views/ReportUserView';
import SelectListView from '../../views/SelectListView';
import RoomInfoEditView from '../../views/RoomInfoEditView';
import ChangeAvatarView from '../../views/ChangeAvatarView';
import RoomMembersView from '../../views/RoomMembersView';
import SearchMessagesView from '../../views/SearchMessagesView';
import SelectedUsersView from '../../views/SelectedUsersView';
import InviteUsersView from '../../views/InviteUsersView';
import InviteUsersEditView from '../../views/InviteUsersEditView';
import MessagesView from '../../views/MessagesView';
import AutoTranslateView from '../../views/AutoTranslateView';
import DirectoryView from '../../views/DirectoryView';
import NotificationPrefView from '../../views/NotificationPreferencesView';
import E2EEToggleRoomView from '../../views/E2EEToggleRoomView';
import PushTroubleshootView from '../../views/PushTroubleshootView';
import ForwardLivechatView from '../../views/ForwardLivechatView';
import ForwardMessageView from '../../views/ForwardMessageView';
import CloseLivechatView from '../../views/CloseLivechatView';
import CannedResponsesListView from '../../views/CannedResponsesListView';
import CannedResponseDetail from '../../views/CannedResponseDetail';
import LivechatEditView from '../../views/LivechatEditView';
import PickerView from '../../views/PickerView';
import ThreadMessagesView from '../../views/ThreadMessagesView';
import TeamChannelsView from '../../views/TeamChannelsView';
import ReadReceiptsView from '../../views/ReadReceiptView';
import ProfileView from '../../views/ProfileView';
import ChangePasswordView from '../../views/ChangePasswordView';
import DisplayPrefsView from '../../views/DisplayPrefsView';
import SettingsView from '../../views/SettingsView';
import LanguageView from '../../views/LanguageView';
import ThemeView from '../../views/ThemeView';
import DefaultBrowserView from '../../views/DefaultBrowserView';
import ScreenLockConfigView from '../../views/ScreenLockConfigView';
import AdminPanelView from '../../views/AdminPanelView';
import NewMessageView from '../../views/NewMessageView';
import CreateChannelView from '../../views/CreateChannelView';
import UserPreferencesView from '../../views/UserPreferencesView';
import UserNotificationPrefView from '../../views/UserNotificationPreferencesView';
import LegalView from '../../views/LegalView';
import SecurityPrivacyView from '../../views/SecurityPrivacyView';
import MediaAutoDownloadView from '../../views/MediaAutoDownloadView';
import E2EEncryptionSecurityView from '../../views/E2EEncryptionSecurityView';
import StatusView from '../../views/StatusView';
import CreateDiscussionView from '../../views/CreateDiscussionView';
import E2ESaveYourPasswordView from '../../views/E2ESaveYourPasswordView';
import E2EHowItWorksView from '../../views/E2EHowItWorksView';
import E2EEnterYourPasswordView from '../../views/E2EEnterYourPasswordView';
import QueueListView from '../../ee/omnichannel/views/QueueListView';
import AddChannelTeamView from '../../views/AddChannelTeamView';
import AddExistingChannelView from '../../views/AddExistingChannelView';
import DiscussionsView from '../../views/DiscussionsView';
import AccessibilityAndAppearanceView from '../../views/AccessibilityAndAppearanceView';
import { SupportedVersionsWarning } from '../../containers/SupportedVersions';
// InsideStack
import AttachmentView from '../../views/AttachmentView';
import ModalBlockView from '../../views/ModalBlockView';
import JitsiMeetView from '../../views/JitsiMeetView';
import ShareView from '../../views/ShareView';
import CallView from '../../views/CallView';

// ─── withNavigation wrappers ──────────────────────────────────────────────────
// Cast through `any` to break the type cycle that would arise from each view's
// navigation prop referencing ModalStackParamList ← StaticParamList<typeof ModalStack>
// ← these components. HOC static properties (navigationOptions) are forwarded by
// hoistNonReactStatics inside connect() and withTheme(), so `.navigationOptions`
// is still reachable on the connect/withTheme-wrapped default exports for options callbacks.

const RoomViewScreen: ComponentType<StaticScreenProps<MasterDetailChatsStackParamList['RoomView']>> = withNavigation(
	RoomView as any
) as any;

// class components
const RoomActionsViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['RoomActionsView']>> = withNavigation(
	RoomActionsView as any
) as any;
const SelectListViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['SelectListView']>> = withNavigation(
	SelectListView as any
) as any;
const SearchMessagesViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['SearchMessagesView']>> = withNavigation(
	SearchMessagesView as any
) as any;
const MessagesViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['MessagesView']>> = withNavigation(
	MessagesView as any
) as any;
const ThreadMessagesViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['ThreadMessagesView']>> = withNavigation(
	ThreadMessagesView as any
) as any;
const TeamChannelsViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['TeamChannelsView']>> = withNavigation(
	TeamChannelsView as any
) as any;
const ReadReceiptsViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['ReadReceiptsView']>> = withNavigation(
	ReadReceiptsView as any
) as any;
const ScreenLockConfigViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['ScreenLockConfigView']>> = withNavigation(
	ScreenLockConfigView as any
) as any;

// function components
const RoomInfoEditViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['RoomInfoEditView']>> = withNavigation(
	RoomInfoEditView as any
) as any;
const InviteUsersViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['InviteUsersView']>> = withNavigation(
	InviteUsersView as any
) as any;
const DirectoryViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['DirectoryView']>> = withNavigation(
	DirectoryView as any
) as any;
const E2EEToggleRoomViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['E2EEToggleRoomView']>> = withNavigation(
	E2EEToggleRoomView as any
) as any;
const CannedResponsesListViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['CannedResponsesListView']>> =
	withNavigation(CannedResponsesListView as any) as any;
const LivechatEditViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['LivechatEditView']>> = withNavigation(
	LivechatEditView as any
) as any;
const ProfileViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['ProfileView']>> = withNavigation(
	ProfileView as any
) as any;
const ChangePasswordViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['ChangePasswordView']>> = withNavigation(
	ChangePasswordView as any
) as any;
const CreateDiscussionViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['CreateDiscussionView']>> = withNavigation(
	CreateDiscussionView as any
) as any;
const E2EEnterYourPasswordViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['E2EEnterYourPasswordView']>> =
	withNavigation(E2EEnterYourPasswordView as any) as any;
const UserPreferencesViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['UserPreferencesView']>> = withNavigation(
	UserPreferencesView as any
) as any;
const SecurityPrivacyViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['SecurityPrivacyView']>> = withNavigation(
	SecurityPrivacyView as any
) as any;
const PushTroubleshootViewScreen: ComponentType<StaticScreenProps<ModalStackParamList['PushTroubleshootView']>> = withNavigation(
	PushTroubleshootView as any
) as any;
const SupportedVersionsWarningScreen: ComponentType<StaticScreenProps<ModalStackParamList['SupportedVersionsWarning']>> =
	withNavigation(SupportedVersionsWarning as any) as any;

// InsideStack class components
const ModalBlockViewScreen: ComponentType<StaticScreenProps<MasterDetailInsideStackParamList['ModalBlockView']>> = withNavigation(
	ModalBlockView as any
) as any;
const ShareViewScreen: ComponentType<StaticScreenProps<MasterDetailInsideStackParamList['ShareView']>> = withNavigation(
	ShareView as any
) as any;

// ─── ChatsStackNavigator ──────────────────────────────────────────────────────

const ChatsStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		RoomView: createNativeStackScreen({
			screen: RoomViewScreen,
			options: { title: '' }
		})
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

// ─── DrawerNavigator ──────────────────────────────────────────────────────────

const DrawerNav = createDrawerNavigator({
	screenOptions: { drawerType: 'permanent', headerShown: false, drawerStyle: { ...drawerStyle } },
	drawerContent: () => <RoomsListView />,
	screens: {
		ChatsStackNavigator: ChatsStack
	}
});

// ─── ModalStackNavigator ──────────────────────────────────────────────────────

const ModalStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		RoomActionsView: createNativeStackScreen({
			screen: RoomActionsViewScreen,
			options: props => RoomActionsView.navigationOptions!({ ...props, isMasterDetail: true })
		}),
		RoomInfoView,
		ReportUserView,
		SelectListView: SelectListViewScreen,
		RoomInfoEditView: RoomInfoEditViewScreen,
		ChangeAvatarView,
		RoomMembersView,
		SearchMessagesView: createNativeStackScreen({
			screen: SearchMessagesViewScreen,
			options: SearchMessagesView.navigationOptions
		}),
		SelectedUsersView,
		InviteUsersView: InviteUsersViewScreen,
		AddChannelTeamView,
		AddExistingChannelView,
		InviteUsersEditView,
		MessagesView: MessagesViewScreen,
		AutoTranslateView,
		DirectoryView: DirectoryViewScreen,
		QueueListView,
		NotificationPrefView,
		E2EEToggleRoomView: E2EEToggleRoomViewScreen,
		ForwardMessageView,
		ForwardLivechatView,
		CloseLivechatView,
		CannedResponsesListView: CannedResponsesListViewScreen,
		CannedResponseDetail,
		LivechatEditView: LivechatEditViewScreen,
		PickerView,
		ThreadMessagesView: ThreadMessagesViewScreen,
		DiscussionsView,
		TeamChannelsView: TeamChannelsViewScreen,
		ReadReceiptsView: createNativeStackScreen({
			screen: ReadReceiptsViewScreen,
			options: props => ReadReceiptsView.navigationOptions!({ ...props, isMasterDetail: true })
		}),
		SettingsView,
		LegalView,
		LanguageView,
		ThemeView,
		DefaultBrowserView,
		ScreenLockConfigView: createNativeStackScreen({
			screen: ScreenLockConfigViewScreen,
			options: ScreenLockConfigView.navigationOptions
		}),
		StatusView,
		ProfileView: ProfileViewScreen,
		ChangePasswordView: ChangePasswordViewScreen,
		DisplayPrefsView,
		AdminPanelView,
		NewMessageView,
		CreateChannelView,
		CreateDiscussionView: CreateDiscussionViewScreen,
		E2ESaveYourPasswordView,
		E2EHowItWorksView,
		E2EEnterYourPasswordView: E2EEnterYourPasswordViewScreen,
		UserPreferencesView: UserPreferencesViewScreen,
		UserNotificationPrefView,
		SecurityPrivacyView: SecurityPrivacyViewScreen,
		MediaAutoDownloadView,
		E2EEncryptionSecurityView,
		PushTroubleshootView: PushTroubleshootViewScreen,
		SupportedVersionsWarning: SupportedVersionsWarningScreen,
		AccessibilityAndAppearanceView
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	const navigation = useNavigation<NativeStackNavigationProp<any>>();
	return (
		<ModalContainer navigation={navigation} theme={theme}>
			<Navigator screenOptions={themedHeader(theme)} />
		</ModalContainer>
	);
});

// ─── InsideStackNavigator (MasterDetailStack root) ────────────────────────────

const InsideStack = createNativeStackNavigator({
	screenOptions: {
		...defaultHeader,
		presentation: isIOS ? 'containedTransparentModal' : 'containedModal'
	},
	screens: {
		DrawerNavigator: createNativeStackScreen({
			screen: DrawerNav as any,
			options: { headerShown: false }
		}),
		ModalStackNavigator: createNativeStackScreen({
			screen: ModalStack as any,
			options: { headerShown: false }
		}),
		AttachmentView,
		ModalBlockView: createNativeStackScreen({
			screen: ModalBlockViewScreen,
			options: ModalBlockView.navigationOptions as any
		}),
		JitsiMeetView: createNativeStackScreen({
			screen: JitsiMeetView,
			options: {
				headerShown: false,
				animation: isIOS ? 'default' : 'none'
			}
		}),
		ShareView: ShareViewScreen,
		CallView: createNativeStackScreen({
			screen: CallView,
			options: { headerShown: false }
		})
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

const MasterDetailStack = InsideStack.getComponent();

export default MasterDetailStack;
