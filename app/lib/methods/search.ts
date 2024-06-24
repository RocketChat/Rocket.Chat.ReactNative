import { Q } from '@nozbe/watermelondb';

import { sanitizeLikeString, slugifyLikeString } from '../database/utils';
import database from '../database/index';
import { store as reduxStore } from '../store/auxStore';
import { spotlight } from '../services/restApi';
import { ISearch, ISearchLocal, IUserMessage, SubscriptionType, TSubscriptionModel } from '../../definitions';
import { isGroupChat, isReadOnly } from './helpers';
import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../encryption/utils';

export type TSearch = ISearchLocal | IUserMessage | ISearch;

let debounce: null | ((reason: string) => void) = null;

export const localSearchSubscription = async ({
	text = '',
	filterUsers = true,
	filterRooms = true,
	filterMessagingAllowed = false
}): Promise<ISearchLocal[]> => {
	const searchText = text.trim();
	const db = database.active;
	const likeString = sanitizeLikeString(searchText);
	const slugifiedString = slugifyLikeString(searchText);
	let subscriptions = await db
		.get('subscriptions')
		.query(
			Q.or(
				// `sanitized_fname` is an optional column, so it's going to start null and it's going to get filled over time
				Q.where('sanitized_fname', Q.like(`%${slugifiedString}%`)),
				// TODO: Remove the conditionals below at some point. It is merged at 4.39
				// the param 'name' is slugified by the server when the slugify setting is enable, just for channels and teams
				Q.where('name', Q.like(`%${slugifiedString}%`)),
				// Still need the below conditionals because at the first moment the the sanitized_fname won't be filled
				Q.where('name', Q.like(`%${likeString}%`)),
				Q.where('fname', Q.like(`%${likeString}%`))
			),
			Q.sortBy('room_updated_at', Q.desc)
		)
		.fetch();

	if (filterUsers && !filterRooms) {
		subscriptions = subscriptions.filter(item => item.t === 'd' && !isGroupChat(item));
	} else if (!filterUsers && filterRooms) {
		subscriptions = subscriptions.filter(item => item.t !== 'd' || isGroupChat(item));
	}

	if (filterMessagingAllowed) {
		const username = reduxStore.getState().login.user.username as string;
		const encryptionEnabled = reduxStore.getState().encryption.enabled as boolean;
		const filteredSubscriptions = await Promise.all(
			subscriptions.map(async item => {
				if (await isReadOnly(item, username)) {
					return null;
				}

				if (isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: item.encrypted, E2EKey: item.E2EKey })) {
					return null;
				}
				if (isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: item.encrypted })) {
					return null;
				}

				return item;
			})
		);
		subscriptions = filteredSubscriptions.filter(item => item !== null) as TSubscriptionModel[];
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
		teamMain: item.teamMain,
		prid: item.prid,
		f: item.f
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
			Q.sortBy('ts', Q.desc),
			Q.take(50)
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
	// the users provided by localSearchUsersMessageByRid return the username properly, data.username
	// Example: Diego Mello's user -> {name: "Diego Mello", username: "diego.mello"}
	// Meanwhile, the username provided by localSearchSubscription is in name's property
	// Example: Diego Mello's subscription -> {fname: "Diego Mello",  name: "diego.mello"}
	let usernames = [];
	if (rid && filterUsers) {
		localSearchData = await localSearchUsersMessageByRid({ text, rid });
		usernames = localSearchData.map(sub => sub.username as string);
	} else {
		localSearchData = await localSearchSubscription({ text, filterUsers, filterRooms });
		usernames = localSearchData.map(sub => sub.name as string);
	}

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
					.filter(
						user =>
							!data.some(sub =>
								// Check comments at usernames' declaration
								rid && 'username' in sub ? user.username === sub.username : user.username === sub.name
							)
					) // Make sure to remove users already on local database
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
