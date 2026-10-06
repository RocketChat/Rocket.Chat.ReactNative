import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

import database from '~/lib/database';
import { getRoomAvatar, getRoomTitle } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import { type ICategoryRoom } from '../types';

export const filterRoomsByTitle = (rooms: ICategoryRoom[], searchText: string) => {
	const normalizedSearch = searchText.trim().toLowerCase();
	if (!normalizedSearch) {
		return rooms;
	}
	return rooms.filter(room => room.title.toLowerCase().includes(normalizedSearch));
};

export const useCategoryRoomCandidates = (searchText: string) => {
	const [rooms, setRooms] = useState<ICategoryRoom[]>([]);

	useEffect(() => {
		const subscription = database.active
			.get('subscriptions')
			.query(Q.where('archived', false), Q.where('open', true), Q.where('t', Q.notEq('l')), Q.sortBy('room_updated_at', Q.desc))
			.observe()
			.subscribe({
				next: subscriptions =>
					setRooms(
						subscriptions.map(subscription => ({
							rid: subscription.rid,
							title: getRoomTitle(subscription),
							avatar: getRoomAvatar(subscription),
							t: subscription.t
						}))
					),
				error: log
			});
		return () => subscription.unsubscribe();
	}, []);

	return filterRoomsByTitle(rooms, searchText);
};
