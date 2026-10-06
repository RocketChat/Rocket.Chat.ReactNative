import { shallowEqual, useDispatch } from 'react-redux';

import { setUser } from '~/actions/login';
import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import log from '~/lib/methods/helpers/log';
import { saveSidebarCategories } from '~/lib/services/restApi';
import {
	CONVERSATIONS_GROUP,
	isVisibleGroup,
	reorderGroups,
	toSidebarCategories
} from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';

export interface ICategoryOrderGroup {
	id: string;
	title: string;
}

export const useCategoryOrder = () => {
	const dispatch = useDispatch();
	const { storedCategories, customCategoryNames, sectionsOrder, groupOrder } = useSidebarCategories();
	const { showFavorites, groupByType } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const visibleGroups = groupOrder.filter(key => isVisibleGroup(key, { customCategoryNames, showFavorites, groupByType }));
	const showsConversations = visibleGroups.includes(CONVERSATIONS_GROUP);

	const movableGroups: ICategoryOrderGroup[] = visibleGroups
		.filter(key => key !== CONVERSATIONS_GROUP)
		.map(key => ({ id: key, title: customCategoryNames.get(key) ?? i18n.t(key) }));
	const pinnedGroup: ICategoryOrderGroup | undefined = showsConversations
		? { id: CONVERSATIONS_GROUP, title: i18n.t('Chats') }
		: undefined;

	const saveOrder = async (orderedIds: string[]) => {
		const reorderedGroups = showsConversations ? [...orderedIds, CONVERSATIONS_GROUP] : orderedIds;
		const sidebarCategories = toSidebarCategories(storedCategories, reorderGroups(groupOrder, reorderedGroups), sectionsOrder);
		dispatch(setUser({ sidebarCategories }));
		try {
			await saveSidebarCategories(sidebarCategories);
		} catch (error) {
			dispatch(setUser({ sidebarCategories: storedCategories }));
			log(error);
		}
	};

	return { movableGroups, pinnedGroup, saveOrder };
};
