import { useEffect, useState } from 'react';

import { useDebounce } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import { getTeamListRoom } from '~/lib/services/restApi';
import { type TTeamChannel } from '../types';

const API_FETCH_COUNT = 25;

interface IRoomsPage {
	filter: string | null;
	generation: number;
	items: TTeamChannel[];
	loading: boolean;
	loadingMore: boolean;
	end: boolean;
}

const createPage = (filter: string | null, generation: number): IRoomsPage => ({
	filter,
	generation,
	items: [],
	loading: filter !== null,
	loadingMore: false,
	end: filter === null
});

const fetchRooms = async (teamId: string, filter: string, offset: number) => {
	try {
		const result = await getTeamListRoom({ teamId, offset, count: API_FETCH_COUNT, type: 'all', filter });
		return result.success ? result.rooms : null;
	} catch (e) {
		log(e);
		return null;
	}
};

const appendRooms = (page: IRoomsPage, generation: number, rooms: TTeamChannel[] | null): IRoomsPage => {
	if (page.generation !== generation) {
		return page;
	}
	if (!rooms) {
		return { ...page, loading: false, loadingMore: false };
	}
	return {
		...page,
		items: [...page.items, ...rooms],
		loading: false,
		loadingMore: false,
		end: rooms.length < API_FETCH_COUNT
	};
};

export const usePaginatedTeamRooms = (teamId: string, filter: string | null) => {
	const [page, setPage] = useState(() => createPage(filter, 0));
	if (page.filter !== filter) {
		setPage(createPage(filter, page.generation + 1));
	}
	const { generation } = page;

	useEffect(() => {
		if (filter === null) {
			return;
		}
		let isCancelled = false;
		fetchRooms(teamId, filter, 0).then(rooms => {
			if (!isCancelled) {
				setPage(prev => appendRooms(prev, generation, rooms));
			}
		});
		return () => {
			isCancelled = true;
		};
	}, [teamId, filter, generation]);

	const loadMore = useDebounce(() => {
		if (page.filter === null || page.loading || page.loadingMore || page.end) {
			return;
		}
		setPage(prev => ({ ...prev, loadingMore: true }));
		fetchRooms(teamId, page.filter, page.items.length).then(rooms => setPage(prev => appendRooms(prev, generation, rooms)));
	}, 300);

	const updateItems = (update: (items: TTeamChannel[]) => TTeamChannel[]) =>
		setPage(prev => ({ ...prev, items: update(prev.items) }));

	return { items: page.items, loading: page.loading, loadingMore: page.loadingMore, loadMore, updateItems };
};
