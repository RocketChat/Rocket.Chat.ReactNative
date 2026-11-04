import { type ISidebarCategory } from '~/definitions';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { SYSTEM_GROUPS } from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { useCustomCategory } from './useCustomCategory';

export const useSettingsCategory = (categoryId: string): ISidebarCategory | undefined => {
	const { storedCategories } = useSidebarCategories();
	const customCategory = useCustomCategory(categoryId);
	if (!SYSTEM_GROUPS.includes(categoryId)) {
		return customCategory;
	}
	return storedCategories.find(category => category._id === categoryId) ?? { _id: categoryId, name: categoryId, default: true };
};
