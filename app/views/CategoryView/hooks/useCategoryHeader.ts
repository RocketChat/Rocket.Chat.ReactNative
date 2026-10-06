import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useLayoutEffect, useState } from 'react';

import i18n from '~/i18n';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { headerRightActions, type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { type ChatsStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import { useNewMessage } from '~/views/RoomsListView/hooks/useNewMessage';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';

export const useCategoryHeader = (header: string) => {
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'CategoryView'>>();
	const { colors } = useTheme();
	const isMasterDetail = useMasterDetail();
	const { canCreateRoom, goToNewMessage } = useNewMessage();
	const { customCategoryNames } = useSidebarCategories();
	const categoryName = customCategoryNames.get(header);
	const [isCustomCategory] = useState(categoryName !== undefined);
	const showNewMessageAction = hasNativeHeaderBar && canCreateRoom;

	useEffect(() => {
		if (isCustomCategory && categoryName === undefined) {
			navigation.goBack();
		}
	}, [navigation, isCustomCategory, categoryName]);

	useLayoutEffect(() => {
		const goToSettings = () => {
			if (isMasterDetail) {
				navigation.navigate('ModalStackNavigator', { screen: 'CategorySettingsView', params: { categoryId: header } });
			} else {
				navigation.navigate('CategorySettingsView', { categoryId: header });
			}
		};
		const actions: IHeaderAction[] = [];
		if (categoryName !== undefined) {
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
			...(categoryName !== undefined ? { title: categoryName } : {}),
			...headerRightActions(actions)
		});
	}, [navigation, colors, header, isMasterDetail, categoryName, showNewMessageAction, goToNewMessage]);

	return { showNewMessageButton: !hasNativeHeaderBar && canCreateRoom, goToNewMessage };
};
