import { shallowEqual, useDispatch } from 'react-redux';

import { setPreference } from '~/actions/sortPreferences';
import { type IPreferences } from '~/definitions';
import { type DisplayMode, type SortBy } from '~/lib/constants/constantDisplayMode';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { saveSortPreference } from '~/lib/methods/userPreferencesMethods';

export const useDisplayShortcuts = () => {
	const dispatch = useDispatch();
	const { displayMode, showAvatar, sortBy } = useAppSelector(state => state.sortPreferences, shallowEqual);

	const setSortPreference = (preference: Partial<IPreferences>) => {
		dispatch(setPreference(preference));
		saveSortPreference(preference);
	};

	return {
		displayMode,
		showAvatar,
		sortBy,
		setDisplayMode: (mode: DisplayMode) => setSortPreference({ displayMode: mode }),
		toggleAvatar: () => setSortPreference({ showAvatar: !showAvatar }),
		setSortBy: (order: SortBy) => setSortPreference({ sortBy: order })
	};
};
