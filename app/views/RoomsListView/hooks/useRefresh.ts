import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { roomsRequest } from '../../../actions/rooms';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';

export const useRefresh = ({ searching }: { searching: boolean }) => {
	'use memo';

	const refreshing = useAppSelector(state => state.rooms.refreshing);
	const dispatch = useDispatch();

	const onRefresh = useCallback(() => {
		if (searching) {
			return;
		}
		dispatch(roomsRequest({ allData: true }));
	}, [searching, dispatch]);

	return {
		refreshing,
		onRefresh
	};
};
