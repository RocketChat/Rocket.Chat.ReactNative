import { useCallback, useState } from 'react';

import { search as searchLib } from '../../../lib/methods';
import { IRoomItem } from '../definitions';
import { useDebounce } from '../../../lib/methods/helpers/debounce';

export const useSearch = () => {
	const [searchEnabled, setSearchEnabled] = useState(false);
	const [searching, setSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<IRoomItem[]>([]);

	const search = useDebounce(async (text: string) => {
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
	}, [search]);

	const stopSearch = useCallback(() => {
		setSearchEnabled(false);
		setSearching(false);
		setSearchResults([]);
	}, []);

	return {
		searching,
		searchEnabled,
		searchResults,
		startSearch,
		stopSearch,
		search
	};
};
