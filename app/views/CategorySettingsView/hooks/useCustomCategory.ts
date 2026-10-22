import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';

export const useCustomCategory = (categoryId: string) => {
	const { storedCategories, customCategoryNames } = useSidebarCategories();
	return customCategoryNames.has(categoryId) ? storedCategories.find(category => category._id === categoryId) : undefined;
};
