import { setRoomsCategory } from '~/lib/services/restApi';
import { alertCategoryError } from '~/views/CategorySettingsView/utils/alertCategoryError';

export const assignRoomToCategory = async (rid: string, category?: string) => {
	if (!category) {
		return;
	}
	try {
		await setRoomsCategory([rid], category);
	} catch (error) {
		alertCategoryError(error);
	}
};
