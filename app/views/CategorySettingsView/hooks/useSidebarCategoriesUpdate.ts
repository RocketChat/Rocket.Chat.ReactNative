import { useDispatch } from 'react-redux';

import { setUser } from '~/actions/login';
import { type ISidebarCategory } from '~/definitions';
import { saveSidebarCategories } from '~/lib/services/restApi';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { patchCategory, removeCategory } from '../utils/categoryUpdates';

export const useSidebarCategoriesUpdate = (categoryId: string) => {
	const dispatch = useDispatch();
	const { storedCategories } = useSidebarCategories();

	const updateCategory = async (patch: Partial<Omit<ISidebarCategory, '_id'>>) => {
		const sidebarCategories = patchCategory(storedCategories, categoryId, patch);
		dispatch(setUser({ sidebarCategories }));
		try {
			await saveSidebarCategories(sidebarCategories);
		} catch (error) {
			dispatch(setUser({ sidebarCategories: storedCategories }));
			throw error;
		}
	};

	const deleteCategory = async () => {
		const sidebarCategories = removeCategory(storedCategories, categoryId);
		await saveSidebarCategories(sidebarCategories);
		dispatch(setUser({ sidebarCategories }));
	};

	return { updateCategory, deleteCategory };
};
