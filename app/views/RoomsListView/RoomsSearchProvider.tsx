import { createContext, memo, ReactNode } from 'react';

import { IRoomItem } from './definitions';
import { useSearch } from './hooks/useSearch';

export const RoomsContext = createContext<{
	searching: boolean;
	searchResults: IRoomItem[];
	startSearch: () => void;
	stopSearch: () => void;
}>({
	searching: false,
	searchResults: [],
	startSearch: () => {},
	stopSearch: () => {}
});

interface RoomsProviderProps {
	children: ReactNode;
}

export const RoomsProvider = memo(({ children }: RoomsProviderProps) => {
	const { searching, searchResults, startSearch, stopSearch } = useSearch();

	return <RoomsContext.Provider value={{ searching, searchResults, startSearch, stopSearch }}>{children}</RoomsContext.Provider>;
});
