import { useState } from 'react';

import { textInputDebounceTime } from '~/lib/constants/debounceConfig';
import { useDebounce } from '~/lib/methods/helpers';

export const useThreadsSearch = () => {
	const [isSearching, setIsSearching] = useState(false);
	const [searchText, setSearchText] = useState('');
	const onSearchChangeText = useDebounce((text: string) => setSearchText(text), textInputDebounceTime);

	const startSearch = () => setIsSearching(true);
	const cancelSearch = () => {
		onSearchChangeText.cancel();
		setIsSearching(false);
		setSearchText('');
	};

	return { isSearching, searchText, startSearch, cancelSearch, onSearchChangeText };
};
