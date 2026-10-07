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
	sectionsOrder: readonly string[],
	category: ISidebarCategory
): ISidebarCategory[] =>
	toSidebarCategories(
		[...storedCategories.filter(stored => stored._id !== category._id), category],
		[category._id, ...groupOrder.filter(groupId => groupId !== category._id)],
		sectionsOrder
	);

export const useCreateCategory = () => {
	const dispatch = useDispatch();
	const { storedCategories, sectionsOrder, groupOrder } = useSidebarCategories();
	const [creating, setCreating] = useState(false);
	const [categoryId] = useState(() => random(17));

	const createCategory = async (name: string, roomIds: string[]) => {
		const category: ISidebarCategory = { _id: categoryId, name: name.trim() };
		const sidebarCategories = prependCategory(storedCategories, groupOrder, sectionsOrder, category);
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
