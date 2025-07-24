import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '../../../lib/hooks';
import { closeSearchHeader, openSearchHeader, setSearch } from '../../../actions/rooms';
import { search } from '../../../lib/methods';
import { IRoomItem } from '../definitions';

export const useSearch = () => {
	const searchText = useAppSelector(state => state.rooms.searchText);
	const dispatch = useDispatch();
	const [searchEnabled, setSearchEnabled] = useState(false);
	const [searching, setSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<IRoomItem[]>([]);

	useEffect(() => {
		const handleSearch = async () => {
			if (!searchEnabled) return;

			setSearching(true);
			const result = await search({ text: searchText });
			setSearchResults(result as IRoomItem[]);
			setSearching(false);
		};
		handleSearch();
	}, [searchText, searchEnabled]);

	const startSearch = useCallback(() => {
		setSearchEnabled(true);
		dispatch(openSearchHeader());
	}, [dispatch]);

	const stopSearch = useCallback(() => {
		setSearchEnabled(false);
		setSearching(false);
		setSearchResults([]);
		dispatch(closeSearchHeader());
		dispatch(setSearch(''));
	}, [dispatch]);

	return {
		searching,
		searchEnabled,
		searchResults,
		startSearch,
		stopSearch
	};
};
