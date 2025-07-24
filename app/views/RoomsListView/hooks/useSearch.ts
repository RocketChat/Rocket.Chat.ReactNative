import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { closeSearchHeader, openSearchHeader } from '../../../actions/rooms';
import { search as searchLib } from '../../../lib/methods';
import { IRoomItem } from '../definitions';
import { useDebounce } from '../../../lib/methods/helpers/debounce';

export const useSearch = () => {
	const dispatch = useDispatch();
	const [searchEnabled, setSearchEnabled] = useState(false);
	const [searching, setSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<IRoomItem[]>([]);

	const search = useDebounce(async (text: string) => {
		console.log('search', text);
		if (!searchEnabled) return;
		setSearching(true);
		const result = await searchLib({ text });
		setSearchResults(result as IRoomItem[]);
		setSearching(false);
	}, 500);

	const startSearch = useCallback(() => {
		setSearchEnabled(true);
		setSearching(true);
		search('');
		dispatch(openSearchHeader());
	}, [dispatch, search]);

	const stopSearch = useCallback(() => {
		setSearchEnabled(false);
		setSearching(false);
		setSearchResults([]);
		dispatch(closeSearchHeader());
	}, [dispatch]);

	return {
		searching,
		searchEnabled,
		searchResults,
		startSearch,
		stopSearch,
		search
	};
};
