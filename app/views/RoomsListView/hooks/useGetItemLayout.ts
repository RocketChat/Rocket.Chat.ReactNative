import { useCallback } from 'react';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '../../../lib/hooks';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { DisplayMode } from '../../../lib/constants';

export const useGetItemLayout = () => {
	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();
	const { displayMode } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const height = displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight;

	const getItemLayout = useCallback(
		(_: any, index: number) => ({
			length: height,
			offset: height * index,
			index
		}),
		[height]
	);

	return getItemLayout;
};
