import { useNavigation } from '@react-navigation/native';
import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { type KeyboardFocus } from 'react-native-external-keyboard';
import { type SearchBarCommands } from 'react-native-screens';

import { showActionSheetRef } from '~/containers/ActionSheet';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useIsAccessibilityNavigationEnabled } from '~/lib/hooks/useIsAccessibilityNavigationEnabled';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { hasNativeHeaderBar, isTablet } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { headerLeftActions, headerRightActions, type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import RoomsListHeaderView from '../components/Header';
import ServersList from '../components/ServersList';
import { RoomsSearchContext } from '../contexts/RoomsSearchProvider';
import { useNewMessage } from './useNewMessage';
import { useRoomsListSubtitle } from './useRoomsListSubtitle';

interface IRightActionsParams {
	issuesWithNotifications?: boolean;
	disabled?: boolean;
	dangerColor: string;
	onTroubleshoot: () => void;
	onSearch: () => void;
	onDirectory: () => void;
}

const getRightActions = ({
	issuesWithNotifications,
	disabled,
	dangerColor,
	onTroubleshoot,
	onSearch,
	onDirectory
}: IRightActionsParams): IHeaderAction[] => {
	const troubleshoot: IHeaderAction = {
		label: i18n.t('Troubleshooting'),
		icon: 'notification-disabled',
		tintColor: dangerColor,
		testID: 'rooms-list-view-push-troubleshoot',
		onPress: onTroubleshoot
	};
	const search: IHeaderAction = {
		label: i18n.t('Search'),
		icon: 'search',
		testID: 'rooms-list-view-search',
		disabled,
		legacyHeaderOnly: true,
		onPress: onSearch
	};
	const directory: IHeaderAction = {
		label: i18n.t('Directory'),
		icon: 'directory',
		testID: 'rooms-list-view-directory',
		disabled,
		onPress: onDirectory
	};
	return [...(issuesWithNotifications ? [troubleshoot] : []), search, directory];
};

const getScreenFocusNavigation = (navigation: any, isMasterDetail: boolean) => {
	if (!isMasterDetail) {
		return navigation;
	}
	return navigation.getParent()?.getParent() ?? navigation;
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
	const serverName = useAppSelector(state => state.settings.Site_Name as string);
	const { colors } = useTheme();

	const nativeHeaderSubtitle = useRoomsListSubtitle();
	const { canCreateRoom, goToNewMessage } = useNewMessage();
	const disabled = supportedVersionsStatus === 'expired' || requirePasswordChange;

	const badgeColor =
		supportedVersionsStatus === 'warn'
			? colors.buttonBackgroundDangerDefault
			: notificationPresenceCap
				? colors.userPresenceDisabled
				: undefined;

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

	useLayoutEffect(() => {
		const onDrawerPress = isMasterDetail
			? () => navigation.navigate('ModalStackNavigator', { screen: 'SettingsView' })
			: () => navigation.toggleDrawer();

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

		const rightActions = getRightActions({
			issuesWithNotifications,
			disabled,
			dangerColor: colors.fontDanger,
			onTroubleshoot: navigateToPushTroubleshootView,
			onSearch: startSearch,
			onDirectory: goDirectory
		});

		if (hasNativeHeaderBar) {
			const drawerAction: IHeaderAction = {
				label: i18n.t('Menu'),
				icon: 'hamburguer',
				disabled,
				badge: badgeColor ? { color: badgeColor } : undefined,
				onPress: onDrawerPress
			};
			const cancelSearchAction: IHeaderAction = { label: i18n.t('Cancel'), onPress: stopSearch };
			const newMessageAction: IHeaderAction = {
				label: i18n.t('Create_new_channel_team_dm_discussion'),
				icon: 'add',
				tintColor: colors.buttonBackgroundPrimaryDefault,
				variant: 'prominent',
				placement: 'toolbar',
				disabled,
				onPress: goToNewMessage
			};
			navigation.setOptions({
				headerTransparent: true,
				headerStyle: { backgroundColor: `${colors.surfaceNeutral}B3` },
				headerBlurEffect: 'regular',
				headerTitle: serverName,
				headerSubtitle: nativeHeaderSubtitle,
				headerTitleTestID: 'rooms-list-header-servers-list-button',
				onHeaderTitlePress: () => showActionSheetRef({ children: <ServersList />, enableContentPanningGesture: false }),
				headerSearchBarOptions: {
					ref: searchBarRef,
					placement: isTablet ? 'stacked' : 'automatic',
					placeholder: i18n.t('Search'),
					hideNavigationBar: !isTablet,
					onFocus: startSearch,
					onChangeText: (event: { nativeEvent: { text: string } }) => search(event.nativeEvent.text),
					onCancelButtonPress: stopSearch
				},
				...headerLeftActions([drawerAction]),
				...headerRightActions(
					isTablet && searchEnabled ? [cancelSearchAction] : [...rightActions, ...(canCreateRoom ? [newMessageAction] : [])]
				)
			});
			return;
		}

		const options = {
			headerLeft: () => (
				<HeaderButton.Drawer
					ref={drawerButtonRef}
					navigation={navigation}
					testID='rooms-list-view-sidebar'
					onPress={onDrawerPress}
					badge={() => (badgeColor ? <HeaderButton.BadgeWarn color={badgeColor} /> : null)}
					disabled={disabled}
				/>
			),
			headerTitle: () => <RoomsListHeaderView search={search} searchEnabled={searchEnabled} />,
			...headerRightActions(rightActions)
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
		searchEnabled,
		canCreateRoom,
		goToNewMessage,
		goDirectory,
		navigateToPushTroubleshootView,
		startSearch,
		stopSearch,
		search,
		serverName,
		nativeHeaderSubtitle,
		badgeColor
	]);

	useEffect(() => {
		if (!hasNativeHeaderBar || searchEnabled) {
			return;
		}
		if (isMasterDetail) {
			searchBarRef.current?.cancelSearch();
			return;
		}
		searchBarRef.current?.clearText();
	}, [searchEnabled, isMasterDetail]);

	const focusNavigation = getScreenFocusNavigation(navigation, isMasterDetail);

	useEffect(() => {
		if (!isAccessibilityNavigationEnabled) {
			return;
		}
		let task: ReturnType<typeof InteractionManager.runAfterInteractions> | undefined;
		const focusDrawerButton = () => {
			task?.cancel();
			task = InteractionManager.runAfterInteractions(() => {
				drawerButtonRef.current?.focus();
			});
		};
		if (focusNavigation.isFocused()) {
			focusDrawerButton();
		}
		const unsubscribe = focusNavigation.addListener('focus', focusDrawerButton);
		return () => {
			unsubscribe();
			task?.cancel();
		};
	}, [focusNavigation, isAccessibilityNavigationEnabled]);

	return { options };
};
