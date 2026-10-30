import { Keyboard } from 'react-native';
import { useState } from 'react';

import { textInputDebounceTime } from '~/lib/constants/debounceConfig';
import { useDebounce } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { type TTeamChannel } from '../types';
import { usePaginatedTeamRooms } from './usePaginatedTeamRooms';

export const useTeamChannels = (teamId: string) => {
	const [searchText, setSearchText] = useState<string | null>(null);
	const isSearching = searchText !== null;
	const browse = usePaginatedTeamRooms(teamId, '');
	const filtered = usePaginatedTeamRooms(teamId, searchText || null);
	const visible = searchText ? filtered : browse;

	const onSearchChangeText = useDebounce((text: string) => setSearchText(text), textInputDebounceTime);

	const startSearch = () => {
		logEvent(events.TC_SEARCH);
		setSearchText(text => text ?? '');
	};

	const cancelSearch = () => {
		logEvent(events.TC_CANCEL_SEARCH);
		Keyboard.dismiss();
		onSearchChangeText.cancel();
		setSearchText(null);
	};

	const updateItem = (id: string, patch: Partial<TTeamChannel>) => {
		const patchItems = (items: TTeamChannel[]) => items.map(item => (item._id === id ? { ...item, ...patch } : item));
		browse.updateItems(patchItems);
		filtered.updateItems(patchItems);
	};

	const removeItem = (id: string) => {
		const dropItem = (items: TTeamChannel[]) => items.filter(item => item._id !== id);
		browse.updateItems(dropItem);
		filtered.updateItems(dropItem);
	};

	return {
		list: visible.items,
		loading: visible.loading,
		loadingMore: visible.loadingMore,
		isSearching,
		loadMore: visible.loadMore,
		startSearch,
		cancelSearch,
		onSearchChangeText,
		updateItem,
		removeItem
	};
};
