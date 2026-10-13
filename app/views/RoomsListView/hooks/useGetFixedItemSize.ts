import { useCallback } from 'react';
import { shallowEqual } from 'react-redux';

import { type IRoomItem } from '~/containers/RoomItem/interfaces';
import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

export const useGetFixedItemSize = () => {
	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();
	const { displayMode } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const height = displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight;

	return useCallback((item: IRoomItem) => (item.separator ? undefined : height), [height]);
};
