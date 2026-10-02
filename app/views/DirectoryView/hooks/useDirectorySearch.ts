import { useEffect, useRef, useState } from 'react';

import { type IServerRoom } from '~/definitions';
import { announceSearchResultsForAccessibility } from '~/lib/methods/helpers/announceSearchResultsForAccessibility';
import { useDebounce } from '~/lib/methods/helpers/debounce';
import log, { events, logEvent } from '~/lib/methods/helpers/log';
import { getDirectory } from '~/lib/services/restApi';

type DirectoryResults = { rooms: IServerRoom[]; fetchedCount: number; total: number };

const emptyResults: DirectoryResults = { rooms: [], fetchedCount: 0, total: -1 };

const appendPage = (results: DirectoryResults, page: IServerRoom[], total: number): DirectoryResults => {
	const ids = new Set(results.rooms.map(room => room._id));
	return {
		rooms: [...results.rooms, ...page.filter(room => !ids.has(room._id))],
		fetchedCount: results.fetchedCount + page.length,
		total
	};
};

const hasMore = (results: DirectoryResults) => results.fetchedCount < results.total;

export const useDirectorySearch = (directoryDefaultView: string) => {
	const [results, setResults] = useState(emptyResults);
	const [loading, setLoading] = useState(false);
	const [text, setText] = useState('');
	const [globalUsers, setGlobalUsers] = useState(true);
	const [type, setType] = useState(directoryDefaultView);
	const searchGeneration = useRef(0);
	const newSearchPending = useRef(false);

	// useDebounce keeps a ref to the latest callback, so this always reads fresh state
	const load = useDebounce(async () => {
		const newSearch = newSearchPending.current;
		newSearchPending.current = false;
		if (!newSearch && (loading || !hasMore(results))) {
			return;
		}

		if (newSearch) {
			searchGeneration.current += 1;
			setResults(emptyResults);
		}
		const requestGeneration = searchGeneration.current;
		const isStale = () => requestGeneration !== searchGeneration.current;
		setLoading(true);

		try {
			const directories = await getDirectory({
				text,
				type,
				workspace: globalUsers ? 'all' : 'local',
				offset: newSearch ? 0 : results.fetchedCount,
				count: 50,
				sort: type === 'users' ? { username: 1 } : { usersCount: -1 }
			});
			if (isStale()) {
				return;
			}
			if (directories.success) {
				setResults(prev => appendPage(newSearch ? emptyResults : prev, directories.result as IServerRoom[], directories.total));
				setLoading(false);
				// Announce the full total on a fresh search; loadMore pages shouldn't re-announce
				if (newSearch) {
					announceSearchResultsForAccessibility(directories.total);
				}
			} else {
				setLoading(false);
			}
		} catch (e) {
			log(e);
			if (!isStale()) {
				setLoading(false);
			}
		}
	}, 200);

	const search = () => {
		newSearchPending.current = true;
		load();
	};
	const loadMore = () => load();

	const onSearchChangeText = (newText: string) => {
		setText(newText);
		search();
	};

	const changeType = (newType: string) => {
		setType(newType);

		if (newType === 'users') {
			logEvent(events.DIRECTORY_SEARCH_USERS);
		} else if (newType === 'channels') {
			logEvent(events.DIRECTORY_SEARCH_CHANNELS);
		} else if (newType === 'teams') {
			logEvent(events.DIRECTORY_SEARCH_TEAMS);
		}

		search();
	};

	const toggleWorkspace = () => {
		setGlobalUsers(prev => !prev);
		search();
	};

	useEffect(() => {
		search();
	}, []);

	return {
		data: results.rooms,
		loading,
		type,
		globalUsers,
		search,
		loadMore,
		onSearchChangeText,
		changeType,
		toggleWorkspace
	};
};
