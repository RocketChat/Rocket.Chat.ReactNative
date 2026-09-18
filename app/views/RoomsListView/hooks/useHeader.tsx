import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { type KeyboardFocus } from 'react-native-external-keyboard';
import { type SearchBarCommands } from 'react-native-screens';

import { showActionSheetRef } from '~/containers/ActionSheet';
import { type TIconsName } from '~/containers/CustomIcon';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useIsAccessibilityNavigationEnabled } from '~/lib/hooks/useIsAccessibilityNavigationEnabled';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { hasNativeHeaderBar, isTablet } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import RoomsListHeaderView from '../components/Header';
import { RoomsSearchContext } from '../contexts/RoomsSearchProvider';

const MAX_HEADER_RIGHT_ACTIONS = 2;

interface IHeaderRightAction {
	key: string;
	present: boolean;
	iconName: TIconsName;
	testID: string;
	accessibilityLabel: string;
	color?: string;
	disabled?: boolean;
	onPress: () => void;
}

const splitHeaderRightActions = (actions: IHeaderRightAction[]) => {
	const present = actions.filter(action => action.present);
	if (present.length <= MAX_HEADER_RIGHT_ACTIONS + 1) {
		return { visible: present, overflow: [] as IHeaderRightAction[] };
	}
	return { visible: present.slice(0, MAX_HEADER_RIGHT_ACTIONS), overflow: present.slice(MAX_HEADER_RIGHT_ACTIONS) };
};

export const useHeader = () => {
	const { searchEnabled, search, startSearch, stopSearch } = useContext(RoomsSearchContext);
	const [options, setOptions] = useState<any>(null);
	const isAccessibilityNavigationEnabled = useIsAccessibilityNavigationEnabled();
	const drawerButtonRef = useRef<KeyboardFocus>(null);
	const searchBarRef = useRef<SearchBarCommands>(null);
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);
	const requirePasswordChange = useAppSelector(state => getUserSelector(state).requirePasswordChange);
	const isMasterDetail = useMasterDetail();
	const navigation = useNavigation<any>();
	const issuesWithNotifications = useAppSelector(state => state.troubleshootingNotification.issuesWithNotifications);
	const notificationPresenceCap = useAppSelector(state => state.app.notificationPresenceCap);
	const connecting = useAppSelector(state => state.meteor.connecting || state.server.loading || state.login.isFetching);
	const connected = useAppSelector(state => state.meteor.connected);
	const isFetchingRooms = useAppSelector(state => state.rooms.isFetching);
	const serverName = useAppSelector(state => state.settings.Site_Name as string);
	const server = useAppSelector(state => state.server.server);
	const { colors } = useTheme();

	const nativeHeaderSubtitle =
		supportedVersionsStatus === 'expired'
			? 'Cannot connect'
			: connecting
				? i18n.t('Connecting')
				: isFetchingRooms
					? i18n.t('Updating')
					: !connected
						? i18n.t('Waiting_for_network')
						: server?.replace(/(^\w+:|^)\/\//, '');
	const [
		createPublicChannelPermission,
		createPrivateChannelPermission,
		createTeamPermission,
		createDirectMessagePermission,
		createDiscussionPermission
	] = usePermissions(['create-c', 'create-p', 'create-team', 'create-d', 'start-discussion']);
	const canCreateRoom =
		[
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createTeamPermission,
			createDirectMessagePermission,
			createDiscussionPermission
		].filter((r: boolean) => r === true).length > 0;

	const disabled = supportedVersionsStatus === 'expired' || requirePasswordChange;

	const getBadge = useCallback(() => {
		if (supportedVersionsStatus === 'warn') {
			return <HeaderButton.BadgeWarn color={colors.buttonBackgroundDangerDefault} />;
		}
		if (notificationPresenceCap) {
			return <HeaderButton.BadgeWarn color={colors.userPresenceDisabled} />;
		}
		return null;
	}, [supportedVersionsStatus, notificationPresenceCap, colors]);

	const goDirectory = useCallback(() => {
		logEvent(events.RL_GO_DIRECTORY);
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'DirectoryView' });
		} else {
			navigation.navigate('DirectoryView');
		}
	}, [isMasterDetail, navigation]);

	const navigateToPushTroubleshootView = useCallback(() => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'PushTroubleshootView' });
		} else {
			navigation.navigate('PushTroubleshootView');
		}
	}, [isMasterDetail, navigation]);

	const goToNewMessage = useCallback(() => {
		logEvent(events.RL_GO_NEW_MSG);

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'NewMessageView' });
		} else {
			navigation.navigate('NewMessageStackNavigator');
		}
	}, [isMasterDetail, navigation]);

	useLayoutEffect(() => {
		const headerLeft = () => (
			<HeaderButton.Drawer
				ref={drawerButtonRef}
				navigation={navigation}
				testID='rooms-list-view-sidebar'
				onPress={
					isMasterDetail
						? () => navigation.navigate('ModalStackNavigator', { screen: 'SettingsView' })
						: () => navigation.toggleDrawer()
				}
				badge={getBadge}
				disabled={disabled}
			/>
		);

		if (searchEnabled && !hasNativeHeaderBar) {
			const searchOptions = {
				headerLeft: () => (
					<HeaderButton.Container style={{ marginLeft: 1 }} left>
						<HeaderButton.Item iconName='close' onPress={stopSearch} />
					</HeaderButton.Container>
				),
				headerTitle: () => <RoomsListHeaderView search={search} searchEnabled={searchEnabled} />,
				headerRight: () => null
			};
			navigation.setOptions(searchOptions);
			if (isTablet) {
				setOptions(searchOptions);
			}
			return;
		}

		if (hasNativeHeaderBar) {
			const { visible, overflow } = splitHeaderRightActions([
				{
					key: 'create',
					present: canCreateRoom,
					iconName: 'add',
					accessibilityLabel: i18n.t('Create_new_channel_team_dm_discussion'),
					testID: 'rooms-list-view-create-channel',
					disabled,
					onPress: goToNewMessage
				},
				{
					key: 'push-troubleshoot',
					present: issuesWithNotifications,
					iconName: 'notification-disabled',
					accessibilityLabel: i18n.t('Troubleshooting'),
					testID: 'rooms-list-view-push-troubleshoot',
					color: colors.fontDanger,
					onPress: navigateToPushTroubleshootView
				},
				{
					key: 'directory',
					present: true,
					iconName: 'directory',
					accessibilityLabel: i18n.t('Directory'),
					testID: 'rooms-list-view-directory',
					disabled,
					onPress: goDirectory
				}
			]);

			navigation.setOptions({
				headerLargeTitle: false,
				headerTitle: serverName,
				headerSubtitle: nativeHeaderSubtitle,
				headerLeft,
				headerStyle: { backgroundColor: colors.surfaceNeutral },
				headerTransparent: false,
				scrollEdgeEffects: { top: 'hidden' },
				headerSearchBarOptions: {
					ref: searchBarRef,
					placement: 'automatic',
					placeholder: i18n.t('Search'),
					onFocus: startSearch,
					onChangeText: (event: { nativeEvent: { text: string } }) => search(event.nativeEvent.text),
					onCancelButtonPress: stopSearch
				},
				headerRight: () => (
					<HeaderButton.Container>
						{[
							...visible.map(action => (
								<HeaderButton.Item
									key={action.key}
									iconName={action.iconName}
									accessibilityLabel={action.accessibilityLabel}
									color={action.color}
									disabled={action.disabled}
									onPress={action.onPress}
									testID={action.testID}
								/>
							)),
							overflow.length >= 2 ? (
								<HeaderButton.Item
									key='more'
									iconName='kebab'
									accessibilityLabel={i18n.t('More')}
									testID='rooms-list-view-more'
									onPress={() =>
										showActionSheetRef({
											options: overflow.map(action => ({
												title: action.accessibilityLabel,
												icon: action.iconName,
												testID: action.testID,
												onPress: action.onPress
											}))
										})
									}
								/>
							) : null
						]}
					</HeaderButton.Container>
				)
			});
			return;
		}

		const options = {
			headerLeft,
			headerTitle: () => <RoomsListHeaderView search={search} searchEnabled={searchEnabled} />,
			headerRight: () => (
				<HeaderButton.Container>
					{issuesWithNotifications ? (
						<HeaderButton.Item
							iconName='notification-disabled'
							onPress={navigateToPushTroubleshootView}
							testID='rooms-list-view-push-troubleshoot'
							color={colors.fontDanger}
						/>
					) : null}
					{canCreateRoom ? (
						<HeaderButton.Item
							iconName='add'
							accessibilityLabel={i18n.t('Create_new_channel_team_dm_discussion')}
							onPress={goToNewMessage}
							testID='rooms-list-view-create-channel'
							disabled={disabled}
						/>
					) : null}
					<HeaderButton.Item
						iconName='search'
						accessibilityLabel={i18n.t('Search')}
						onPress={startSearch}
						testID='rooms-list-view-search'
						disabled={disabled}
					/>
					<HeaderButton.Item
						iconName='directory'
						accessibilityLabel={i18n.t('Directory')}
						onPress={goDirectory}
						testID='rooms-list-view-directory'
						disabled={disabled}
					/>
				</HeaderButton.Container>
			)
		};

		navigation.setOptions(options);
		if (isTablet) {
			setOptions(options);
		}
	}, [
		disabled,
		issuesWithNotifications,
		navigation,
		isMasterDetail,
		colors,
		canCreateRoom,
		searchEnabled,
		goDirectory,
		navigateToPushTroubleshootView,
		getBadge,
		goToNewMessage,
		startSearch,
		stopSearch,
		search,
		serverName,
		nativeHeaderSubtitle
	]);

	useEffect(() => {
		if (hasNativeHeaderBar && !searchEnabled) {
			searchBarRef.current?.clearText();
		}
	}, [searchEnabled]);

	// The rooms list header persists across native-stack navigation, so autoFocus (mount-only)
	// won't re-fire on back-return or after the list/banner render asynchronously. Re-assert focus
	// on the drawer button every time the screen is focused so external-keyboard/screen-reader
	// navigation always starts from a known element. Regular touch users are left untouched.
	useFocusEffect(
		useCallback(() => {
			if (!isAccessibilityNavigationEnabled) {
				return;
			}
			const task = InteractionManager.runAfterInteractions(() => {
				drawerButtonRef.current?.focus();
			});
			return () => task.cancel();
		}, [isAccessibilityNavigationEnabled])
	);

	return { options };
};
