import { LISTENER } from '~/containers/Toast';
import { type ISidebarCategory } from '~/definitions';
import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import { alertCategoryError } from '../utils/alertCategoryError';
import { useSidebarCategoriesUpdate } from './useSidebarCategoriesUpdate';

export const useDeleteCategory = (category: ISidebarCategory, roomIds: string[]) => {
	const { deleteCategory } = useSidebarCategoriesUpdate(category._id);

	const deleteAndNotify = async () => {
		try {
			const isDeleted = await deleteCategory(roomIds);
			if (!isDeleted) {
				return;
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('Category_deleted', { name: category.name }) });
		} catch (error) {
			alertCategoryError(error);
		}
	};

	return () =>
		showConfirmationAlert({
			title: I18n.t('Delete_category'),
			message: I18n.t('Delete_category_warning', { name: category.name }),
			confirmationText: I18n.t('Delete'),
			onPress: deleteAndNotify
		});
};
