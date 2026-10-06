import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { type KeyboardFocus } from 'react-native-external-keyboard';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import i18n from '~/i18n';
import { useIsAccessibilityNavigationEnabled } from '~/lib/hooks/useIsAccessibilityNavigationEnabled';
import { isTablet } from '~/lib/methods/helpers';
import { headerRightActions, type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import RoomsListHeaderView from '../components/Header';
import { RoomsSearchContext } from '../contexts/RoomsSearchProvider';
import { getRoomsListRightActions, useRoomsListHeaderState } from './useRoomsListHeaderState';

const getScreenFocusNavigation = (navigation: any, isMasterDetail: boolean) => {
	if (!isMasterDetail) {
		return navigation;
	}
	return navigation.getParent()?.getParent() ?? navigation;
};

export const useJsRoomsListHeader = () => {
	const { searchEnabled, search, startSearch, stopSearch } = useContext(RoomsSearchContext);
	const { navigation, isMasterDetail, colors, disabled, badgeColor, showTroubleshoot, navigateToScreen, onDrawerPress } =
		useRoomsListHeaderState();
	const [options, setOptions] = useState<any>(null);
	const isAccessibilityNavigationEnabled = useIsAccessibilityNavigationEnabled();
	const drawerButtonRef = useRef<KeyboardFocus>(null);

	useLayoutEffect(() => {
		const searchAction: IHeaderAction = {
			label: i18n.t('Search'),
			icon: 'search',
			testID: 'rooms-list-view-search',
			disabled,
			onPress: startSearch
		};
		const { troubleshootActions, browseActions } = getRoomsListRightActions({
			showTroubleshoot,
			disabled,
			dangerColor: colors.fontDanger,
			navigateToScreen
		});
		const headerTitle = () => <RoomsListHeaderView search={search} searchEnabled={searchEnabled} />;
		const nextOptions = searchEnabled
			? {
					headerTitle,
					headerLeft: () => (
						<HeaderButton.Container style={{ marginLeft: 1 }} left>
							<HeaderButton.Item iconName='close' onPress={stopSearch} />
						</HeaderButton.Container>
					),
					headerRight: () => null
				}
			: {
					headerTitle,
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
					...headerRightActions([...troubleshootActions, searchAction, ...browseActions])
				};
		navigation.setOptions(nextOptions);
		if (isTablet) {
			setOptions(nextOptions);
		}
	}, [
		navigation,
		colors,
		disabled,
		badgeColor,
		showTroubleshoot,
		navigateToScreen,
		onDrawerPress,
		searchEnabled,
		search,
		startSearch,
		stopSearch
	]);

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
