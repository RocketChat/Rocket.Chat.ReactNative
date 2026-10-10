import { type ISidebarCategory } from '~/definitions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { UNREAD_GROUP } from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { alertCategoryError } from '../utils/alertCategoryError';
import { useSidebarCategoriesUpdate } from './useSidebarCategoriesUpdate';

export const useCategoryUnreadToggles = (category: ISidebarCategory) => {
	const isGroupingUnreadRooms = useAppSelector(state => state.sortPreferences.showUnread);
	const { updateCategory } = useSidebarCategoriesUpdate(category._id);
	const alwaysDisplayDisabled = isGroupingUnreadRooms && category._id !== UNREAD_GROUP;
	const keepOnTopDisabled = isGroupingUnreadRooms;
	const showUnreads = !alwaysDisplayDisabled && Boolean(category.showUnreads);
	const keepUnreadsOnTop = !keepOnTopDisabled && Boolean(category.keepUnreadsOnTop);

	const toggleShowUnreads = () => updateCategory({ showUnreads: !showUnreads }).catch(alertCategoryError);
	const toggleKeepUnreadsOnTop = () => updateCategory({ keepUnreadsOnTop: !keepUnreadsOnTop }).catch(alertCategoryError);

	return {
		showUnreads,
		keepUnreadsOnTop,
		alwaysDisplayDisabled,
		keepOnTopDisabled,
		toggleShowUnreads,
		toggleKeepUnreadsOnTop
	};
};
