import { useDispatch, useStore } from 'react-redux';

import { setUser } from '~/actions/login';
import { type IApplicationState, type ISidebarCategory } from '~/definitions';
import { useCaptureSession } from '~/lib/hooks/useCaptureSession';
import { saveSidebarCategories, setRoomsCategory } from '~/lib/services/restApi';
import { getUserSelector } from '~/selectors/login';
import { useSaveSidebarCategories } from '~/views/RoomsListView/hooks/useSaveSidebarCategories';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { toSidebarCategories } from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { patchCategory, removeCategory } from '../utils/categoryUpdates';

export const useSidebarCategoriesUpdate = (categoryId: string) => {
	const dispatch = useDispatch();
	const store = useStore<IApplicationState>();
	const captureSession = useCaptureSession();
	const saveOptimistically = useSaveSidebarCategories();
	const { storedCategories, sectionsOrder, groupOrder } = useSidebarCategories();

	const updateCategory = async (patch: Partial<Omit<ISidebarCategory, '_id'>>) => {
		const isStored = storedCategories.some(category => category._id === categoryId);
		const categories = isStored ? storedCategories : toSidebarCategories(storedCategories, groupOrder, sectionsOrder);
		const sidebarCategories = patchCategory(categories, categoryId, patch);
		await saveOptimistically(sidebarCategories, storedCategories);
	};

	const deleteCategory = async (roomIds: string[]) => {
		const isSameSession = captureSession();
		if (roomIds.length > 0) {
			await setRoomsCategory(roomIds, null);
			if (!isSameSession()) {
				return false;
			}
		}
		const currentCategories = getUserSelector(store.getState()).sidebarCategories ?? [];
		const sidebarCategories = removeCategory(currentCategories, categoryId);
		await saveSidebarCategories(sidebarCategories);
		if (!isSameSession()) {
			return false;
		}
		dispatch(setUser({ sidebarCategories }));
		return true;
	};

	return { updateCategory, deleteCategory };
};
