import { createContext, memo, ReactNode } from 'react';

import { IRoomItem } from './definitions';
import { useSearch } from './hooks/useSearch';

export const RoomsContext = createContext<{
	searching: boolean;
	searchEnabled: boolean;
	searchResults: IRoomItem[];
	startSearch: () => void;
	stopSearch: () => void;
}>({
	searching: false,
	searchEnabled: false,
	searchResults: [],
	startSearch: () => {},
	stopSearch: () => {}
});

interface RoomsProviderProps {
	children: ReactNode;
}

export const RoomsProvider = memo(({ children }: RoomsProviderProps) => {
	const { searching, searchEnabled, searchResults, startSearch, stopSearch } = useSearch();

	return (
		<RoomsContext.Provider value={{ searching, searchEnabled, searchResults, startSearch, stopSearch }}>
			{children}
		</RoomsContext.Provider>
	);
});
