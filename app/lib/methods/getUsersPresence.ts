import { InteractionManager } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import { type IActiveUsers } from '../../reducers/activeUsers';
import { store as reduxStore } from '../store/auxStore';
import { setActiveUsers } from '../../actions/activeUsers';
import { setUser } from '../../actions/login';
import database from '../database';
import { type IUser } from '../../definitions';
import sdk from '../services/sdk';
import { compareServerVersion } from './helpers';
import userPreferences from './userPreferences';
import { NOTIFICATION_PRESENCE_CAP } from '../constants/notifications';
import { setNotificationPresenceCap } from '../../actions/app';

export const _activeUsersSubTimeout: { activeUsersSubTimeout: boolean | ReturnType<typeof setTimeout> | number } = {
	activeUsersSubTimeout: false
};

export function subscribeUsersPresence() {
	const serverVersion = reduxStore.getState().server.version as string;

	// if server is lower than 1.1.0
	if (compareServerVersion(serverVersion, 'lowerThan', '1.1.0')) {
		if (_activeUsersSubTimeout.activeUsersSubTimeout) {
			clearTimeout(_activeUsersSubTimeout.activeUsersSubTimeout as number);
			_activeUsersSubTimeout.activeUsersSubTimeout = false;
		}
		_activeUsersSubTimeout.activeUsersSubTimeout = setTimeout(() => {
			sdk.subscribe('activeUsers');
		}, 5000);
	} else if (compareServerVersion(serverVersion, 'lowerThan', '4.1.0')) {
		sdk.subscribe('stream-notify-logged', 'user-status');
	}

	// RC 0.49.1
	sdk.subscribe('stream-notify-logged', 'updateAvatar');
	// RC 0.58.0
	sdk.subscribe('stream-notify-logged', 'Users:NameChanged');
}

let usersBatch: string[] = [];

export async function getUsersPresence(usersParams: string[]) {
	const serverVersion = reduxStore.getState().server.version as string;
	const { user: loggedUser } = reduxStore.getState().login;

	// if server is greather than or equal 1.1.0
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '1.1.0')) {
		let params = {};

		// if server is greather than or equal 3.0.0
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.0.0')) {
			// if not have any id
			if (!usersParams.length) {
				return;
			}
			// Request userPresence on demand
			params = { ids: usersParams.join(',') };
		}

		try {
			// RC 1.1.0
			const result = (await sdk.get('users.presence' as any, params as any)) as any;

			if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '4.1.0')) {
				sdk.subscribeRaw('stream-user-presence', ['', { added: usersParams }]);
			}

			if (result.success) {
				const { users } = result;

				const activeUsers = usersParams.reduce((ret: IActiveUsers, id) => {
					const user = users.find((u: IUser) => u._id === id) ?? { _id: id, status: 'offline' };
					const { _id, status, statusText } = user;

					if (loggedUser && loggedUser.id === _id) {
						reduxStore.dispatch(setUser({ status, statusText }));
					}

					ret[_id] = { status, statusText };
					return ret;
				}, {});
				InteractionManager.runAfterInteractions(() => {
					reduxStore.dispatch(setActiveUsers(activeUsers));
				});

				const db = database.active;
				const userCollection = db.get('users');
				try {
					const userIds = users.map((u: IUser) => u._id);
					const existingRecords = await userCollection.query(Q.where('id', Q.oneOf(userIds))).fetch();
					const existingRecordsMap = new Map(existingRecords.map(u => [u.id, u]));

					const operations = users.map((user: IUser) => {
						const existingRecord = existingRecordsMap.get(user._id);
						if (existingRecord) {
							return existingRecord.prepareUpdate(u => {
								Object.assign(u, user);
							});
						}
						return userCollection.prepareCreate(u => {
							u._raw = sanitizedRaw({ id: user._id }, userCollection.schema);
							Object.assign(u, user);
						});
					});

					await db.write(async () => {
						await db.batch(...operations);
					});
				} catch (e) {
					// do nothing
				}
			}
		} catch {
			// do nothing
		}
	}
}

let usersTimer: ReturnType<typeof setTimeout> | null = null;

export function getUserPresence(uid: string) {
	if (!usersTimer) {
		usersTimer = setTimeout(() => {
			getUsersPresence([...new Set(usersBatch)]);
			usersBatch = [];
			usersTimer = null;
		}, 2000);
	}

	if (uid) {
		usersBatch.push(uid);
	}
}

export const setPresenceCap = async (enabled: boolean) => {
	if (enabled) {
		const notificationPresenceCap = await userPreferences.getBool(NOTIFICATION_PRESENCE_CAP);
		if (notificationPresenceCap !== false) {
			userPreferences.setBool(NOTIFICATION_PRESENCE_CAP, true);
			reduxStore.dispatch(setNotificationPresenceCap(true));
		}
	} else {
		userPreferences.removeItem(NOTIFICATION_PRESENCE_CAP);
		reduxStore.dispatch(setNotificationPresenceCap(false));
	}
};
