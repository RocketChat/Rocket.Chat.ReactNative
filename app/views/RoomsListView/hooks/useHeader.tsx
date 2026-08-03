import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { type KeyboardFocus } from 'react-native-external-keyboard';

import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
import i18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useIsAccessibilityNavigationEnabled } from '../../../lib/hooks/useIsAccessibilityNavigationEnabled';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { usePermissions } from '../../../lib/hooks/usePermissions';
import { isTablet } from '../../../lib/methods/helpers';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { getUserSelector } from '../../../selectors/login';
import { useTheme } from '../../../theme';
import RoomsListHeaderView from '../components/Header';
import { RoomsSearchContext } from '../contexts/RoomsSearchProvider';

export const useHeader = () => {
	'use memo';

	const { searchEnabled, search, startSearch, stopSearch } = useContext(RoomsSearchContext);
	const [options, setOptions] = useState<any>(null);
	const isAccessibilityNavigationEnabled = useIsAccessibilityNavigationEnabled();
	const drawerButtonRef = useRef<KeyboardFocus>(null);
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);
	const requirePasswordChange = useAppSelector(state => getUserSelector(state).requirePasswordChange);
	const isMasterDetail = useMasterDetail();
	const navigation = useNavigation<any>();
	const issuesWithNotifications = useAppSelector(state => state.troubleshootingNotification.issuesWithNotifications);
	const notificationPresenceCap = useAppSelector(state => state.app.notificationPresenceCap);
	const { colors } = useTheme();
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
		if (searchEnabled) {
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

		const options = {
			headerLeft: () => (
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
			),
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
		search
	]);

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
