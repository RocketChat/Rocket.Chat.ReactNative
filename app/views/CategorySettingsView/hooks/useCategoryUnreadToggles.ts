import { type ISidebarCategory } from '~/definitions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { alertCategoryError } from '../utils/alertCategoryError';
import { useSidebarCategoriesUpdate } from './useSidebarCategoriesUpdate';

export const useCategoryUnreadToggles = (category: ISidebarCategory) => {
	const isGroupingUnreadRooms = useAppSelector(state => state.sortPreferences.showUnread);
	const { updateCategory } = useSidebarCategoriesUpdate(category._id);
	const showUnreads = !isGroupingUnreadRooms && Boolean(category.showUnreads);
	const keepUnreadsOnTop = !isGroupingUnreadRooms && Boolean(category.keepUnreadsOnTop);

	const toggleShowUnreads = () => updateCategory({ showUnreads: !showUnreads }).catch(alertCategoryError);
	const toggleKeepUnreadsOnTop = () => updateCategory({ keepUnreadsOnTop: !keepUnreadsOnTop }).catch(alertCategoryError);

	return {
		showUnreads,
		keepUnreadsOnTop,
		disabled: isGroupingUnreadRooms,
		toggleShowUnreads,
		toggleKeepUnreadsOnTop
	};
};
