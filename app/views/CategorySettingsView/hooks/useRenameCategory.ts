import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

import { LISTENER } from '~/containers/Toast';
import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { alertCategoryError } from '../utils/alertCategoryError';
import { useSidebarCategoriesUpdate } from './useSidebarCategoriesUpdate';

export const useRenameCategory = (categoryId: string) => {
	const navigation = useNavigation();
	const { updateCategory } = useSidebarCategoriesUpdate(categoryId);
	const [saving, setSaving] = useState(false);

	const rename = async (name: string) => {
		setSaving(true);
		try {
			await updateCategory({ name: name.trim() });
			EventEmitter.emit(LISTENER, { message: I18n.t('Category_saved') });
			navigation.goBack();
		} catch (error) {
			alertCategoryError(error);
		} finally {
			setSaving(false);
		}
	};

	return { rename, saving };
};
