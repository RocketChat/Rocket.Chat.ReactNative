import { useDispatch } from 'react-redux';

import { setPreference } from '~/actions/sortPreferences';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { saveSortPreference } from '~/lib/methods/userPreferencesMethods';

export const useShowCustomCategories = () => {
	const dispatch = useDispatch();
	const groupByType = useAppSelector(state => state.sortPreferences.groupByType);

	return () => {
		if (groupByType) {
			return;
		}
		dispatch(setPreference({ groupByType: true }));
		saveSortPreference({ groupByType: true });
	};
};
