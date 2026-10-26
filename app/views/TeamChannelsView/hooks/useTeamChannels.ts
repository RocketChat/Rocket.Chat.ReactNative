import { Keyboard } from 'react-native';
import { useEffect, useReducer } from 'react';

import { type ERoomType } from '~/definitions/ERoomType';
import { textInputDebounceTime } from '~/lib/constants/debounceConfig';
import { useDebounce } from '~/lib/methods/helpers';
import log, { events, logEvent } from '~/lib/methods/helpers/log';
import { getTeamListRoom } from '~/lib/services/restApi';

const API_FETCH_COUNT = 25;

export interface IItem {
	_id: ERoomType;
	fname: string;
	customFields: object;
	broadcast: boolean;
	encrypted: boolean;
	name: string;
	t: string;
	msgs: number;
	usersCount: number;
	u: { _id: string; name: string };
	ts: string;
	ro: boolean;
	teamId: string;
	default: boolean;
	sysMes: boolean;
	_updatedAt: string;
	teamDefault: boolean;
}

interface ITeamChannelsState {
	loading: boolean;
	loadingMore: boolean;
	data: IItem[];
	isSearching: boolean;
	searchText: string | null;
	search: IItem[];
	end: boolean;
}

type TeamChannelsStateUpdate = Partial<ITeamChannelsState> | ((state: ITeamChannelsState) => Partial<ITeamChannelsState>);

const stateReducer = (state: ITeamChannelsState, update: TeamChannelsStateUpdate): ITeamChannelsState => ({
	...state,
	...(typeof update === 'function' ? update(state) : update)
});

const initialState: ITeamChannelsState = {
	loading: true,
	loadingMore: false,
	data: [],
	isSearching: false,
	searchText: '',
	search: [],
	end: false
};

export const useTeamChannels = (teamId: string) => {
	const [state, updateState] = useReducer(stateReducer, initialState);
	const { loading, loadingMore, data, isSearching, searchText, search } = state;
	const isFiltering = isSearching && !!searchText;

	const load = useDebounce(async () => {
		if (state.loadingMore || state.end) {
			return;
		}

		updateState({ loadingMore: true });
		try {
			const result = await getTeamListRoom({
				teamId,
				offset: isFiltering ? search.length : data.length,
				count: API_FETCH_COUNT,
				type: 'all',
				filter: searchText
			});

			if (!result.success) {
				updateState({ loading: false, loadingMore: false });
				return;
			}

			const { rooms } = result;
			updateState({
				loading: false,
				loadingMore: false,
				end: rooms.length < API_FETCH_COUNT,
				...(isFiltering ? { search: [...search, ...rooms] as IItem[] } : { data: [...data, ...rooms] as IItem[] })
			});
		} catch (e) {
			log(e);
			updateState({ loading: false, loadingMore: false });
		}
	}, 300);

	const onSearchChangeText = useDebounce((text: string) => {
		updateState({
			searchText: text,
			search: [],
			loading: !!text,
			loadingMore: false,
			end: false
		});
		if (text) {
			load();
		}
	}, textInputDebounceTime);

	const startSearch = () => {
		logEvent(events.TC_SEARCH);
		updateState({ isSearching: true });
	};

	const cancelSearch = () => {
		logEvent(events.TC_CANCEL_SEARCH);
		if (!isSearching) {
			return;
		}
		Keyboard.dismiss();
		updateState({
			searchText: null,
			isSearching: false,
			search: [],
			loadingMore: false,
			end: false
		});
	};

	const updateItem = (id: IItem['_id'], patch: Partial<IItem>) => {
		const patchItem = (item: IItem) => (item._id === id ? { ...item, ...patch } : item);
		updateState(prev => ({ data: prev.data.map(patchItem), search: prev.search.map(patchItem) }));
	};

	const removeItem = (id: string) => {
		const keepItem = (item: IItem) => item._id !== id;
		updateState(prev => ({ data: prev.data.filter(keepItem), search: prev.search.filter(keepItem) }));
	};

	useEffect(() => {
		load();
	}, [load]);

	return {
		list: isFiltering ? search : data,
		loading,
		loadingMore,
		isSearching,
		loadMore: load,
		startSearch,
		cancelSearch,
		onSearchChangeText,
		updateItem,
		removeItem
	};
};
