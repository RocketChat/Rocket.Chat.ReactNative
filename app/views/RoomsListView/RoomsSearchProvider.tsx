import { createContext, memo, ReactNode } from 'react';

import { IRoomItem } from './definitions';
import { useSearch } from './hooks/useSearch';

export const RoomsSearchContext = createContext<{
	searching: boolean;
	searchEnabled: boolean;
	searchResults: IRoomItem[];
	startSearch: () => void;
	stopSearch: () => void;
	search: (text: string) => void;
}>({
	searching: false,
	searchEnabled: false,
	searchResults: [],
	startSearch: () => {},
	stopSearch: () => {},
	search: () => {}
});

interface RoomsSearchProviderProps {
	children: ReactNode;
}

export const RoomsSearchProvider = memo(({ children }: RoomsSearchProviderProps) => {
	const { searching, searchEnabled, searchResults, startSearch, stopSearch, search } = useSearch();

	return (
		<RoomsSearchContext.Provider value={{ searching, searchEnabled, searchResults, startSearch, stopSearch, search }}>
			{children}
		</RoomsSearchContext.Provider>
	);
});
