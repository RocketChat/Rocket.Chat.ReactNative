import { useDispatch, useStore } from 'react-redux';

import { setUser } from '~/actions/login';
import { type IApplicationState, type ISidebarCategory } from '~/definitions';
import { saveSidebarCategories } from '~/lib/services/restApi';
import { getUserSelector } from '~/selectors/login';

export const useSaveSidebarCategories = () => {
	const dispatch = useDispatch();
	const store = useStore<IApplicationState>();

	return async (sidebarCategories: ISidebarCategory[], previousCategories: ISidebarCategory[]) => {
		dispatch(setUser({ sidebarCategories }));
		try {
			await saveSidebarCategories(sidebarCategories);
		} catch (error) {
			const isStillCurrent = getUserSelector(store.getState()).sidebarCategories === sidebarCategories;
			if (isStillCurrent) {
				dispatch(setUser({ sidebarCategories: previousCategories }));
			}
			throw error;
		}
	};
};
