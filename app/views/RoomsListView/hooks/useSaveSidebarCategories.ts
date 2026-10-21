import { useDispatch, useStore } from 'react-redux';

import { setUser } from '~/actions/login';
import { type IApplicationState, type ISidebarCategory } from '~/definitions';
import { saveSidebarCategories } from '~/lib/services/restApi';
import { getUserSelector } from '~/selectors/login';

let pendingSaves = 0;
let acceptedCategories: ISidebarCategory[] | undefined;

export const useSaveSidebarCategories = () => {
	const dispatch = useDispatch();
	const store = useStore<IApplicationState>();
	const currentCategories = () => getUserSelector(store.getState()).sidebarCategories;

	return async (sidebarCategories: ISidebarCategory[], { ignoreSupersededFailure = false } = {}) => {
		if (pendingSaves === 0) {
			acceptedCategories = currentCategories();
		}
		pendingSaves += 1;
		dispatch(setUser({ sidebarCategories }));
		try {
			await saveSidebarCategories(sidebarCategories);
			acceptedCategories = sidebarCategories;
		} catch (error) {
			const isSuperseded = currentCategories() !== sidebarCategories;
			if (!isSuperseded) {
				dispatch(setUser({ sidebarCategories: acceptedCategories }));
			} else if (ignoreSupersededFailure) {
				return;
			}
			throw error;
		} finally {
			pendingSaves -= 1;
		}
	};
};
