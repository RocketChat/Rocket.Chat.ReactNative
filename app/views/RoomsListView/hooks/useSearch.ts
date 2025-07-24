import { useCallback, useReducer } from 'react';

import { search as searchLib } from '../../../lib/methods';
import { IRoomItem } from '../definitions';
import { useDebounce } from '../../../lib/methods/helpers/debounce';

interface SearchState {
	searchEnabled: boolean;
	searching: boolean;
	searchResults: IRoomItem[];
}

type SearchAction =
	| { type: 'START_SEARCH' }
	| { type: 'SEARCH_SUCCESS'; payload: IRoomItem[] }
	| { type: 'STOP_SEARCH' }
	| { type: 'SET_SEARCHING' };

const initialState: SearchState = {
	searchEnabled: false,
	searching: false,
	searchResults: []
};

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
	switch (action.type) {
		case 'START_SEARCH':
			return {
				...state,
				searchEnabled: true,
				searching: true
			};
		case 'SEARCH_SUCCESS':
			return {
				...state,
				searching: false,
				searchResults: action.payload
			};
		case 'STOP_SEARCH':
			return {
				...state,
				searchEnabled: false,
				searching: false,
				searchResults: []
			};
		case 'SET_SEARCHING':
			return {
				...state,
				searching: true
			};
		default:
			return state;
	}
};

export const useSearch = () => {
	const [state, dispatch] = useReducer(searchReducer, initialState);

	const search = useDebounce(async (text: string) => {
		if (!state.searchEnabled) return;
		dispatch({ type: 'SET_SEARCHING' });
		const result = await searchLib({ text });
		dispatch({ type: 'SEARCH_SUCCESS', payload: result as IRoomItem[] });
	}, 500);

	const startSearch = useCallback(() => {
		dispatch({ type: 'START_SEARCH' });
		search('');
	}, [search]);

	const stopSearch = useCallback(() => {
		dispatch({ type: 'STOP_SEARCH' });
	}, []);

	return {
		searching: state.searching,
		searchEnabled: state.searchEnabled,
		searchResults: state.searchResults,
		startSearch,
		stopSearch,
		search
	};
};
