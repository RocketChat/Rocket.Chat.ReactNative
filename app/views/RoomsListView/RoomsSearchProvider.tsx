import { createContext, memo, ReactNode } from 'react';

import { IRoomItem } from './definitions';
import { useSearch } from './hooks/useSearch';

export const RoomsContext = createContext<{
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

interface RoomsProviderProps {
	children: ReactNode;
}

export const RoomsProvider = memo(({ children }: RoomsProviderProps) => {
	const { searching, searchEnabled, searchResults, startSearch, stopSearch, search } = useSearch();

	return (
		<RoomsContext.Provider value={{ searching, searchEnabled, searchResults, startSearch, stopSearch, search }}>
			{children}
		</RoomsContext.Provider>
	);
});
