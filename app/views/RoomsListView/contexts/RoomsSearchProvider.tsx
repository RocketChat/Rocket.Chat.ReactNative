import { createContext, createRef, memo, type ReactElement, type RefObject } from 'react';
import { type SearchBarCommands } from 'react-native-screens';

import { type IRoomItem } from '~/containers/RoomItem/interfaces';
import { useSearch } from '../hooks/useSearch';

export const RoomsSearchContext = createContext<{
	searching: boolean;
	searchEnabled: boolean;
	searchResults: IRoomItem[];
	startSearch: () => void;
	stopSearch: () => void;
	resetSearch: () => void;
	search: (text: string) => void;
	searchBarRef: RefObject<SearchBarCommands | null>;
}>({
	searching: false,
	searchEnabled: false,
	searchResults: [],
	startSearch: () => {},
	stopSearch: () => {},
	resetSearch: () => {},
	search: () => {},
	searchBarRef: createRef<SearchBarCommands>()
});

interface RoomsSearchProviderProps {
	children: ReactElement;
}

const RoomsSearchProvider = ({ children }: RoomsSearchProviderProps) => {
	const { searching, searchEnabled, searchResults, startSearch, stopSearch, resetSearch, search, searchBarRef } = useSearch();

	return (
		<RoomsSearchContext.Provider
			value={{ searching, searchEnabled, searchResults, startSearch, stopSearch, resetSearch, search, searchBarRef }}>
			{children}
		</RoomsSearchContext.Provider>
	);
};

export default memo(RoomsSearchProvider);
