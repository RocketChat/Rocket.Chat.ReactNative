import { useState, useCallback, useRef } from 'react';

import isEmpty from 'lodash/isEmpty';

import { Services as RocketChat } from '../../lib/services';
import { useDebounce } from '../../lib/methods/helpers/debounce';

export const useLoadPeers = () => {
	const [state, setState] = useState({
		data: [],
		loading: false,
		text: '',
		total: -1,
		numUsersFetched: 0,
		globalUsers: true,
		type: 'users',
		reachedEnd: false
	});

	const isSearchActive = useRef(false);
	const userIds = useRef(new Set());

	const loadPeersImpl = async ({ newSearch = false, searchText = state.text }) => {
		if (newSearch) {
			userIds.current.clear();
			setState(prevState => ({ ...prevState, data: [], total: -1, numUsersFetched: 0, reachedEnd: false }));
			isSearchActive.current = searchText !== '';
		}

		if ((isSearchActive.current && !newSearch) || state.reachedEnd) {
			// Don't load more results if a search is active
			return;
		}

		setState(prevState => ({ ...prevState, loading: true }));

		try {
			const query = { text: searchText, type: state.type, workspace: state.globalUsers ? 'all' : 'local' };

			const directories = await RocketChat.getDirectory({
				query,
				offset: newSearch ? 0 : state.numUsersFetched,
				count: 50,
				sort: { name: 1 }
			});

			if (directories.success) {
				const newResults = [];
				const results = directories.result;

				for (const item of results) {
					if (!userIds.current.has(item._id)) {
						userIds.current.add(item._id);
						const user = await RocketChat.getUserInfo(item._id);
						if (user.user.roles.includes('Peer Supporter')) {
							newResults.push({ ...item, customFields: user.user.customFields });
						}
					}
				}

				const numUsersFetched = newSearch ? results.length : state.numUsersFetched + results.length;
				setState(prevState => ({
					...prevState,
					data: newSearch ? newResults : [...prevState.data, ...newResults],
					loading: false,
					numUsersFetched: numUsersFetched,
					total: directories.total,
					reachedEnd: numUsersFetched >= directories.total
				}));
			} else {
				setState(prevState => ({ ...prevState, loading: false }));
			}
		} catch (e) {
			console.error(e);
			setState(prevState => ({ ...prevState, loading: false }));
		}
	};

	const debouncedLoadPeers = useDebounce(loadPeersImpl, 300);

	const loadPeers = useCallback(
		({ newSearch = false }) => {
			debouncedLoadPeers({ newSearch, searchText: state.text });
		},
		[state.text]
	);

	const updateSearchText = useCallback((text: string) => {
		setState(prevState => ({ ...prevState, text }));
		debouncedLoadPeers({ newSearch: true, searchText: text });
	}, []);

	return {
		...state,
		loadPeers,
		updateSearchText
	};
};

export function getMarkedDates(agendaItems) {
	const marked: any = {};

	agendaItems.forEach(item => {
		// NOTE: only mark dates with data
		if (item.data && item.data.length > 0 && !isEmpty(item.data[0])) {
			marked[item.title] = { marked: true };
		} else {
			marked[item.title] = { disabled: true };
		}
	});

	return marked;
}
