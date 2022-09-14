import { Q } from '@nozbe/watermelondb';

import { sanitizeLikeString } from '../database/utils';
import database from '../database/index';
import { store as reduxStore } from '../store/auxStore';
import { spotlight } from '../services/restApi';
import { ISearch, ISearchLocal, SubscriptionType, TSubscriptionModel } from '../../definitions';
import { isGroupChat } from './helpers';

let debounce: null | ((reason: string) => void) = null;

export const localSearchSubscription = async ({
	text = '',
	filterUsers = true,
	filterRooms = true
}): Promise<TSubscriptionModel[]> => {
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

	const search = subscriptions.slice(0, 7);

	return search;
};

export const localSearchUsersMessage = async ({ text = '', rid = '' }) => {
	const userID = reduxStore.getState().login.user.id;
	const numberOfSuggestions = reduxStore.getState().settings.Number_of_users_autocomplete_suggestions as number;
	const searchText = text.trim();
	const db = database.active;
	const likeString = sanitizeLikeString(searchText);
	const messages = await db
		.get('messages')
		.query(
			Q.and(
				Q.where('rid', rid),
				// The column u is a JSON object stringfied as: "{"_id":"id","username":"username","name":"name"}"
				// So we need to use the LIKE operator to search for the username
				// Because if we search using (`%${likeString}%`) and the text is "d" it will match with some ids
				Q.where('u', Q.like(`%username%${likeString}%`)),
				Q.where('u', Q.notLike(`%${userID}%`)),
				Q.where('t', null)
			),
			Q.experimentalSortBy('ts', Q.desc),
			Q.experimentalTake(50)
		)
		.fetch();

	const users = messages.map(message => ({ ...message.u, suggestion: true }));
	const removeDuplicatedUsers = users.filter((item1, index) => users.findIndex(item2 => item2._id === item1._id) === index); // Remove duplicated data from response
	const sliceUsers = removeDuplicatedUsers.slice(0, text ? 2 : numberOfSuggestions);

	return sliceUsers;
};

export const search = async ({
	text = '',
	filterUsers = true,
	filterRooms = true,
	rid = ''
}): Promise<(ISearch | ISearchLocal)[]> => {
	const searchText = text.trim();

	if (debounce) {
		debounce('cancel');
	}

	let localSearchData = [];
	if (rid) {
		localSearchData = await localSearchUsersMessage({ text, rid });
	} else {
		localSearchData = await localSearchSubscription({ text, filterUsers, filterRooms });
	}
	const usernames = localSearchData.map(sub => sub.name as string);

	const data = localSearchData as (ISearch | ISearchLocal)[];

	try {
		if (searchText && localSearchData.length < 7) {
			const { users, rooms } = (await Promise.race([
				spotlight(searchText, usernames, { users: filterUsers, rooms: filterRooms }, rid),
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
