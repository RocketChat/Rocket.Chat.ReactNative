import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '../../../lib/hooks';
import { closeSearchHeader, openSearchHeader, setSearch } from '../../../actions/rooms';
import { search } from '../../../lib/methods';
import { IRoomItem } from '../definitions';

export const useSearch = () => {
	const searchText = useAppSelector(state => state.rooms.searchText);
	const dispatch = useDispatch();
	const [searching, setSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<IRoomItem[]>([]);

	useEffect(() => {
		const handleSearch = async () => {
			if (!searching) return;

			const result = await search({ text: searchText });
			setSearchResults(result as IRoomItem[]);
		};
		handleSearch();
	}, [searchText, searching]);

	const startSearch = useCallback(() => {
		dispatch(openSearchHeader());
		setSearching(true);
	}, [dispatch]);

	const stopSearch = useCallback(() => {
		setSearching(false);
		dispatch(closeSearchHeader());
		dispatch(setSearch(''));
	}, [dispatch]);

	return {
		searching,
		searchResults,
		startSearch,
		stopSearch
	};
};
