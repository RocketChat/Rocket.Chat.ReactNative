import { StackActions, useNavigation } from '@react-navigation/native';
import { useState } from 'react';

import { LISTENER } from '~/containers/Toast';
import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { setRoomsCategory } from '~/lib/services/restApi';
import { getRoomChanges } from '../utils/categoryUpdates';
import { alertCategoryError } from '../utils/alertCategoryError';

export const useSaveCategoryRooms = (categoryId: string, initialRoomIds: string[]) => {
	const navigation = useNavigation();
	const [saving, setSaving] = useState(false);

	const saveRooms = async (selectedRoomIds: string[]) => {
		const { addedRoomIds, removedRoomIds } = getRoomChanges(initialRoomIds, selectedRoomIds);
		setSaving(true);
		try {
			if (addedRoomIds.length > 0) {
				await setRoomsCategory(addedRoomIds, categoryId);
			}
			if (removedRoomIds.length > 0) {
				await setRoomsCategory(removedRoomIds, null);
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('Category_saved') });
			navigation.dispatch(StackActions.popTo('CategorySettingsView', { categoryId }));
		} catch (error) {
			alertCategoryError(error);
		} finally {
			setSaving(false);
		}
	};

	return { saveRooms, saving };
};
