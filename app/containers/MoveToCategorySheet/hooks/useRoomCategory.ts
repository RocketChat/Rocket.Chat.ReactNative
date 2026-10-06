import { LISTENER } from '~/containers/Toast';
import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { setRoomsCategory, toggleFavorite } from '~/lib/services/restApi';
import { alertCategoryError } from '~/views/CategorySettingsView/utils/alertCategoryError';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { FAVORITES_GROUP } from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { getCategoryOptionIds, getCurrentCategoryId, type TRoomPlacement } from '../utils/roomCategory';

const moveRoom = async (room: TRoomPlacement, categoryId: string, currentCategoryId: string | undefined) => {
	if (categoryId !== FAVORITES_GROUP) {
		await setRoomsCategory([room.rid], currentCategoryId === categoryId ? null : categoryId);
		return;
	}
	if (currentCategoryId === FAVORITES_GROUP || !room.f) {
		await toggleFavorite(room.rid, currentCategoryId !== FAVORITES_GROUP);
	}
	if (room.category) {
		await setRoomsCategory([room.rid], null);
	}
};

export const useRoomCategory = (room: TRoomPlacement) => {
	const { customCategoryNames, groupOrder } = useSidebarCategories();
	const categoryName = (categoryId: string) => customCategoryNames.get(categoryId) ?? I18n.t('Favorites');
	const currentCategoryId = getCurrentCategoryId(room, customCategoryNames);
	const categoryOptions = getCategoryOptionIds(groupOrder, customCategoryNames).map(categoryId => ({
		id: categoryId,
		name: categoryName(categoryId),
		isFavorites: categoryId === FAVORITES_GROUP
	}));

	const moveToCategory = async (categoryId: string) => {
		try {
			await moveRoom(room, categoryId, currentCategoryId);
			EventEmitter.emit(LISTENER, { message: I18n.t('Category_saved') });
		} catch (error) {
			alertCategoryError(error);
		}
	};

	return {
		categoryOptions,
		currentCategoryId,
		currentCategoryName: currentCategoryId ? categoryName(currentCategoryId) : undefined,
		moveToCategory
	};
};
