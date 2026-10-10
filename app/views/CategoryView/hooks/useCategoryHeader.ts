import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useLayoutEffect } from 'react';

import i18n from '~/i18n';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { headerRightActions, type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { type ChatsStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import { useNewMessage } from '~/views/RoomsListView/hooks/useNewMessage';
import { useIsCustomCategoriesAvailable, useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { categoryIdOfHeader } from '~/views/RoomsListView/utils/groupRooms';
import { SYSTEM_GROUPS } from '~/views/RoomsListView/utils/sidebarGroupOrder';

export const useCategoryHeader = (header: string, title: string) => {
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'CategoryView'>>();
	const { colors } = useTheme();
	const isMasterDetail = useMasterDetail();
	const isCustomCategoriesAvailable = useIsCustomCategoriesAvailable();
	const { customCategoryNames } = useSidebarCategories();
	const categoryName = customCategoryNames.get(header);
	const isCustomCategory = !SYSTEM_GROUPS.includes(categoryIdOfHeader(header));
	const { canCreateRoom, goToNewMessage } = useNewMessage(isCustomCategory ? header : undefined);
	const showNewMessageAction = hasNativeHeaderBar && canCreateRoom;

	useEffect(() => {
		if (isCustomCategory && categoryName === undefined) {
			navigation.goBack();
		}
	}, [navigation, isCustomCategory, categoryName]);

	useLayoutEffect(() => {
		const goToSettings = () => {
			const params = { categoryId: categoryIdOfHeader(header), title };
			if (isMasterDetail) {
				navigation.navigate('ModalStackNavigator', { screen: 'CategorySettingsView', params });
			} else {
				navigation.navigate('CategorySettingsView', params);
			}
		};
		const actions: IHeaderAction[] = [];
		if (isCustomCategoriesAvailable) {
			actions.push({
				label: i18n.t('Category_options'),
				icon: 'kebab',
				testID: 'category-view-options',
				onPress: goToSettings
			});
		}
		if (showNewMessageAction) {
			actions.push({
				label: i18n.t('Create_new_channel_team_dm_discussion'),
				icon: 'add',
				tintColor: colors.buttonBackgroundPrimaryDefault,
				variant: 'prominent',
				placement: 'toolbar',
				onPress: goToNewMessage
			});
		}
		navigation.setOptions({
			title: categoryName ?? title,
			...headerRightActions(actions)
		});
	}, [
		navigation,
		colors,
		header,
		title,
		isMasterDetail,
		isCustomCategoriesAvailable,
		categoryName,
		showNewMessageAction,
		goToNewMessage
	]);

	const selectSection = (sectionHeader: string, sectionTitle: string) =>
		navigation.setParams({ header: sectionHeader, title: sectionTitle });

	return { showNewMessageButton: !hasNativeHeaderBar && canCreateRoom, goToNewMessage, selectSection };
};
