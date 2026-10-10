import { useContext, useLayoutEffect } from 'react';

import { showActionSheetRef } from '~/containers/ActionSheet';
import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { isTablet } from '~/lib/methods/helpers';
import { headerLeftActions, headerRightActions, type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { stackedSearchBarOptions, translucentHeader } from '~/lib/methods/helpers/navigation';
import { useTheme } from '~/theme';
import ServersList from '../components/ServersList';
import { RoomsSearchContext } from '../contexts/RoomsSearchProvider';
import { useNewMessage } from './useNewMessage';
import { useRoomsListHeaderState } from './useRoomsListHeaderState';
import { useRoomsListSubtitle } from './useRoomsListSubtitle';

const openServersList = () => showActionSheetRef({ children: <ServersList />, enableContentPanningGesture: false });

export const useNativeRoomsListHeader = () => {
	const { searchEnabled, search, startSearch, stopSearch, resetSearch, searchBarRef } = useContext(RoomsSearchContext);
	const { navigation, disabled, badgeColor, troubleshootActions, browseActions, onDrawerPress } = useRoomsListHeaderState();
	const { colors } = useTheme();
	const serverName = useAppSelector(state => state.settings.Site_Name as string | undefined);
	const subtitle = useRoomsListSubtitle();
	const { canCreateRoom, goToNewMessage } = useNewMessage();
	const showsCancelSearch = isTablet && searchEnabled;

	useLayoutEffect(() => {
		const drawerAction: IHeaderAction = {
			label: i18n.t('Menu'),
			icon: 'hamburguer',
			disabled,
			badge: badgeColor ? { color: badgeColor } : undefined,
			onPress: onDrawerPress
		};
		const newMessageAction: IHeaderAction = {
			label: i18n.t('Create_new_channel_team_dm_discussion'),
			icon: 'add',
			tintColor: colors.buttonBackgroundPrimaryDefault,
			variant: 'prominent',
			placement: 'toolbar',
			disabled,
			onPress: goToNewMessage
		};
		const cancelSearchAction: IHeaderAction = { label: i18n.t('Cancel'), onPress: stopSearch };

		navigation.setOptions({
			...translucentHeader,
			headerTitle: serverName ?? '',
			headerSubtitle: subtitle,
			headerTitleTestID: 'rooms-list-header-servers-list-button',
			onHeaderTitlePress: openServersList,
			headerSearchBarOptions: {
				...stackedSearchBarOptions({
					ref: searchBarRef,
					onFocus: searchEnabled ? undefined : startSearch,
					onChangeText: search,
					onCancel: resetSearch
				}),
				placement: isTablet ? 'stacked' : 'automatic',
				hideWhenScrolling: true,
				hideNavigationBar: !isTablet
			},
			...headerLeftActions([drawerAction]),
			...headerRightActions(
				showsCancelSearch
					? [cancelSearchAction]
					: [...troubleshootActions, ...browseActions, ...(canCreateRoom ? [newMessageAction] : [])]
			)
		});
	}, [
		navigation,
		colors.buttonBackgroundPrimaryDefault,
		disabled,
		badgeColor,
		troubleshootActions,
		browseActions,
		onDrawerPress,
		canCreateRoom,
		goToNewMessage,
		showsCancelSearch,
		searchEnabled,
		serverName,
		subtitle,
		searchBarRef,
		startSearch,
		stopSearch,
		resetSearch,
		search
	]);
};
