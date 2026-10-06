import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { setUser } from '~/actions/login';
import { LISTENER } from '~/containers/Toast';
import { type ISidebarCategory } from '~/definitions';
import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import log from '~/lib/methods/helpers/log';
import { random } from '~/lib/methods/helpers/random';
import Navigation from '~/lib/navigation/appNavigation';
import { saveSidebarCategories, setRoomsCategory } from '~/lib/services/restApi';
import { toSidebarCategories } from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';

export const prependCategory = (
	storedCategories: ISidebarCategory[],
	groupOrder: string[],
	category: ISidebarCategory
): ISidebarCategory[] => toSidebarCategories([...storedCategories, category], [category._id, ...groupOrder]);

export const useCreateCategory = () => {
	const dispatch = useDispatch();
	const { storedCategories, groupOrder } = useSidebarCategories();
	const [creating, setCreating] = useState(false);

	const createCategory = async (name: string, roomIds: string[]) => {
		const category: ISidebarCategory = { _id: random(17), name: name.trim() };
		const sidebarCategories = prependCategory(storedCategories, groupOrder, category);
		setCreating(true);
		try {
			await saveSidebarCategories(sidebarCategories);
			dispatch(setUser({ sidebarCategories }));
			if (roomIds.length > 0) {
				await setRoomsCategory(roomIds, category._id);
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('Category_created') });
			Navigation.popTo('DrawerNavigator');
		} catch (error: any) {
			log(error);
			showErrorAlert(error?.data?.error ?? error?.message ?? '', I18n.t('Oops'));
		} finally {
			setCreating(false);
		}
	};

	return { createCategory, creating };
};
