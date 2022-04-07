import { Q } from '@nozbe/watermelondb';

import { sanitizeLikeString } from '../database/utils';
import database from '../database/index';
import { spotlight } from '../services/restApi';
import { ISearch, ISearchLocal, SubscriptionType } from '../../definitions';
import { isGroupChat } from './helpers';

let debounce: null | ((reason: string) => void) = null;

export const localSearch = async ({ text = '', filterUsers = true, filterRooms = true }): Promise<(ISearch | ISearchLocal)[]> => {
	const searchText = text.trim();
	const db = database.active;
	const likeString = sanitizeLikeString(searchText);
	let subscriptions = await db
		.get('subscriptions')
		.query(
			Q.or(Q.where('name', Q.like(`%${likeString}%`)), Q.where('fname', Q.like(`%${likeString}%`))),
			Q.experimentalSortBy('room_updated_at', Q.desc)
		)
		.fetch();

	if (filterUsers && !filterRooms) {
		subscriptions = subscriptions.filter(item => item.t === 'd' && !isGroupChat(item));
	} else if (!filterUsers && filterRooms) {
		subscriptions = subscriptions.filter(item => item.t !== 'd' || isGroupChat(item));
	}

	const sliceSubscriptions = subscriptions.slice(0, 7);

	const search = sliceSubscriptions.map(sub => ({
		rid: sub.rid,
		name: sub.name,
		fname: sub?.fname || '',
		avatarETag: sub?.avatarETag || '',
		t: sub.t,
		encrypted: sub?.encrypted || null,
		lastMessage: sub.lastMessage,
		...(sub.teamId && { teamId: sub.teamId })
	})) as (ISearch | ISearchLocal)[];

	return search;
};

export const search = async ({ text = '', filterUsers = true, filterRooms = true }): Promise<(ISearch | ISearchLocal)[]> => {
	const searchText = text.trim();

	if (debounce) {
		debounce('cancel');
	}

	const localSearchData = await localSearch({ text, filterUsers, filterRooms });
	const usernames = localSearchData.map(sub => sub.name);

	const data = localSearchData as (ISearch | ISearchLocal)[];

	try {
		if (localSearchData.length < 7) {
			const { users, rooms } = (await Promise.race([
				spotlight(searchText, usernames, { users: filterUsers, rooms: filterRooms }),
				new Promise((resolve, reject) => (debounce = reject))
			])) as { users: ISearch[]; rooms: ISearch[] };

			if (filterUsers) {
				users
					.filter((item1, index) => users.findIndex(item2 => item2._id === item1._id) === index) // Remove duplicated data from response
					.filter(user => !data.some(sub => user.username === sub.name)) // Make sure to remove users already on local database
					.forEach(user => {
						data.push({
							...user,
							rid: user.username,
							name: user.username,
							t: SubscriptionType.DIRECT,
							search: true
						});
					});
			}
			if (filterRooms) {
				rooms.forEach(room => {
					// Check if it exists on local database
					const index = data.findIndex(item => item.rid === room._id);
					if (index === -1) {
						data.push({
							...room,
							rid: room._id,
							search: true
						});
					}
				});
			}
		}
		debounce = null;
		return data;
	} catch (e) {
		console.warn(e);
		return data;
	}
};
