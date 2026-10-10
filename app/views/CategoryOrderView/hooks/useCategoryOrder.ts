import { shallowEqual } from 'react-redux';

import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import log from '~/lib/methods/helpers/log';
import {
	CONVERSATIONS_GROUP,
	isVisibleGroup,
	reorderGroups,
	toSidebarCategories
} from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { useSaveSidebarCategories } from '~/views/RoomsListView/hooks/useSaveSidebarCategories';

export interface ICategoryOrderGroup {
	id: string;
	title: string;
}

export const useCategoryOrder = () => {
	const saveOptimistically = useSaveSidebarCategories();
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
		try {
			await saveOptimistically(sidebarCategories, storedCategories);
		} catch (error) {
			log(error);
		}
	};

	return { movableGroups, pinnedGroup, saveOrder };
};
