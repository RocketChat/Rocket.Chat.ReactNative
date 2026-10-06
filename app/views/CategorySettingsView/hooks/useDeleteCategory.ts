import { StackActions, useNavigation } from '@react-navigation/native';

import { LISTENER } from '~/containers/Toast';
import { type ISidebarCategory } from '~/definitions';
import I18n from '~/i18n';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import EventEmitter from '~/lib/methods/helpers/events';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import Navigation from '~/lib/navigation/appNavigation';
import { setRoomsCategory } from '~/lib/services/restApi';
import { alertCategoryError } from '../utils/alertCategoryError';
import { useSidebarCategoriesUpdate } from './useSidebarCategoriesUpdate';

export const useDeleteCategory = (category: ISidebarCategory, roomIds: string[]) => {
	const navigation = useNavigation();
	const isMasterDetail = useMasterDetail();
	const { deleteCategory } = useSidebarCategoriesUpdate(category._id);

	const deleteAndLeave = async () => {
		try {
			await deleteCategory();
			if (roomIds.length > 0) {
				await setRoomsCategory(roomIds, null);
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('Category_deleted', { name: category.name }) });
			if (isMasterDetail) {
				Navigation.popTo('DrawerNavigator');
			} else {
				navigation.dispatch(StackActions.popTo('RoomsListView'));
			}
		} catch (error) {
			alertCategoryError(error);
		}
	};

	return () =>
		showConfirmationAlert({
			title: I18n.t('Delete_category'),
			message: I18n.t('Delete_category_warning', { name: category.name }),
			confirmationText: I18n.t('Delete'),
			onPress: deleteAndLeave
		});
};
