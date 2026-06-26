import { Keyboard } from 'react-native';
import { useEffect, useReducer } from 'react';

import { type ERoomType } from '../../definitions/ERoomType';
import { textInputDebounceTime } from '../../lib/constants/debounceConfig';
import { useDebounce } from '../../lib/methods/helpers';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { getTeamListRoom } from '../../lib/services/restApi';

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
	'use memo';

	const [state, updateState] = useReducer(stateReducer, initialState);
	const { loading, loadingMore, data, isSearching, searchText, search } = state;

	const load = useDebounce(async () => {
		// useDebounce keeps a ref to the latest callback, so this always reads fresh state
		const { loadingMore, data, search, isSearching, searchText, end } = state;
		const length = isSearching ? search.length : data.length;
		if (loadingMore || end) {
			return;
		}

		updateState({ loadingMore: true });
		try {
			const result = await getTeamListRoom({
				teamId,
				offset: length,
				count: API_FETCH_COUNT,
				type: 'all',
				filter: searchText
			});

			if (result.success) {
				const newState: Partial<ITeamChannelsState> = {
					loading: false,
					loadingMore: false,
					end: result.rooms.length < API_FETCH_COUNT
				};

				if (isSearching) {
					newState.search = [...search, ...result.rooms] as IItem[];
				} else {
					newState.data = [...data, ...result.rooms] as IItem[];
				}

				updateState(newState);
			} else {
				updateState({ loading: false, loadingMore: false });
			}
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
		updateState(prev => ({ data: prev.data.map(item => (item._id === id ? { ...item, ...patch } : item)) }));
	};

	const removeItem = (id: string) => {
		updateState(prev => ({ data: prev.data.filter(item => item._id !== id) }));
	};

	// Run the initial channels load when the hook mounts; `load` is a stable debounced ref, so this fires once
	useEffect(() => {
		load();
	}, [load]);

	return {
		list: isSearching ? search : data,
		loading,
		loadingMore,
		isSearching,
		searchText,
		loadMore: load,
		startSearch,
		cancelSearch,
		onSearchChangeText,
		updateItem,
		removeItem
	};
};
