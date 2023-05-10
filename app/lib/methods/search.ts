import { Q } from '@nozbe/watermelondb';

import { sanitizeLikeString } from '../database/utils';
import database from '../database/index';
import { store as reduxStore } from '../store/auxStore';
import { spotlight } from '../services/restApi';
import { ISearch, ISearchLocal, IUserMessage, SubscriptionType } from '../../definitions';
import { isGroupChat } from './helpers';

export type TSearch = ISearchLocal | IUserMessage | ISearch;

let debounce: null | ((reason: string) => void) = null;

export const localSearchSubscription = async ({ text = '', filterUsers = true, filterRooms = true }): Promise<ISearchLocal[]> => {
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

	const search = subscriptions.slice(0, 7).map(item => ({
		_id: item._id,
		rid: item.rid,
		name: item.name,
		fname: item.fname,
		avatarETag: item.avatarETag,
		t: item.t,
		encrypted: item.encrypted,
		lastMessage: item.lastMessage,
		status: item.status,
		teamMain: item.teamMain
	})) as ISearchLocal[];

	return search;
};

export const localSearchUsersMessageByRid = async ({ text = '', rid = '' }): Promise<IUserMessage[]> => {
	const userId = reduxStore.getState().login.user.id;
	const numberOfSuggestions = reduxStore.getState().settings.Number_of_users_autocomplete_suggestions as number;
	const searchText = text.trim();
	const db = database.active;
	const likeString = sanitizeLikeString(searchText);
	const messages = await db
		.get('messages')
		.query(
			Q.and(Q.where('rid', rid), Q.where('u', Q.notLike(`%${userId}%`)), Q.where('t', null)),
			Q.experimentalSortBy('ts', Q.desc),
			Q.experimentalTake(50)
		)
		.fetch();

	const regExp = new RegExp(`${likeString}`, 'i');
	const users = messages.map(message => message.u);

	const usersFromLocal = users
		.filter((item1, index) => users.findIndex(item2 => item2._id === item1._id) === index) // Remove duplicated data from response
		.filter(user => user?.name?.match(regExp) || user?.username?.match(regExp))
		.slice(0, text ? 2 : numberOfSuggestions);

	return usersFromLocal;
};

export const search = async ({ text = '', filterUsers = true, filterRooms = true, rid = '' }): Promise<TSearch[]> => {
	const searchText = text.trim();

	if (debounce) {
		debounce('cancel');
	}

	let localSearchData = [];
	if (rid) {
		localSearchData = await localSearchUsersMessageByRid({ text, rid });
	} else {
		localSearchData = await localSearchSubscription({ text, filterUsers, filterRooms });
	}
	const usernames = localSearchData.map(sub => sub.name as string);

	const data: TSearch[] = localSearchData;

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
							fname: user.name,
							t: SubscriptionType.DIRECT,
							search: true
						});
					});
			}
			if (filterRooms) {
				rooms.forEach(room => {
					// Check if it exists on local database
					const index = data.findIndex(item => 'rid' in item && item.rid === room._id);
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
