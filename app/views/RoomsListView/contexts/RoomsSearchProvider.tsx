import { createContext, memo, type ReactElement } from 'react';

import { type IRoomItem } from '../../../containers/RoomItem/interfaces';
import { useSearch } from '../hooks/useSearch';

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
	children: ReactElement;
}

const RoomsSearchProvider = ({ children }: RoomsSearchProviderProps) => {
	'use memo';

	const { searching, searchEnabled, searchResults, startSearch, stopSearch, search } = useSearch();

	return (
		<RoomsSearchContext.Provider value={{ searching, searchEnabled, searchResults, startSearch, stopSearch, search }}>
			{children}
		</RoomsSearchContext.Provider>
	);
};

export default memo(RoomsSearchProvider);
