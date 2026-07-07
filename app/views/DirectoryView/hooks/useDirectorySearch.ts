import { useEffect, useState } from 'react';

import { type IServerRoom } from '../../../definitions';
import { announceSearchResultsForAccessibility } from '../../../lib/methods/helpers/announceSearchResultsForAccessibility';
import { useDebounce } from '../../../lib/methods/helpers/debounce';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { getDirectory } from '../../../lib/services/restApi';

export const useDirectorySearch = (directoryDefaultView: string) => {
	'use memo';

	const [data, setData] = useState<IServerRoom[]>([]);
	const [loading, setLoading] = useState(false);
	const [text, setText] = useState('');
	const [total, setTotal] = useState(-1);
	const [globalUsers, setGlobalUsers] = useState(true);
	const [type, setType] = useState(directoryDefaultView);

	// useDebounce keeps a ref to the latest callback, so this always reads fresh state
	const load = useDebounce(async ({ newSearch = false }: { newSearch?: boolean } = {}) => {
		if (!newSearch && (loading || data.length === total)) {
			return;
		}

		if (newSearch) {
			setData([]);
			setTotal(-1);
		}
		setLoading(true);

		try {
			const directories = await getDirectory({
				text,
				type,
				workspace: globalUsers ? 'all' : 'local',
				offset: newSearch ? 0 : data.length,
				count: 50,
				sort: type === 'users' ? { username: 1 } : { usersCount: -1 }
			});
			if (directories.success) {
				setData(prev => [...(newSearch ? [] : prev), ...(directories.result as IServerRoom[])]);
				setTotal(directories.total);
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
			setLoading(false);
		}
	}, 200);

	const search = () => load({ newSearch: true });
	const loadMore = () => load({});

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

	// Run the initial search when the hook mounts; `search` is stable, so this fires once
	useEffect(() => {
		search();
	}, []);

	return {
		data,
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
