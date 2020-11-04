import { InteractionManager } from 'react-native';
import semver from 'semver';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
import { setActiveUsers } from '../../actions/activeUsers';
import { setUser } from '../../actions/login';
import database from '../database';

export function subscribeUsersPresence() {
	const serverVersion = reduxStore.getState().server.version;

	// if server is lower than 1.1.0
	if (serverVersion && semver.lt(serverVersion, '1.1.0')) {
		if (this.activeUsersSubTimeout) {
			clearTimeout(this.activeUsersSubTimeout);
			this.activeUsersSubTimeout = false;
		}
		this.activeUsersSubTimeout = setTimeout(() => {
			this.sdk.subscribe('activeUsers');
		}, 5000);
	} else {
		this.sdk.subscribe('stream-notify-logged', 'user-status');
	}

	// RC 0.49.1
	this.sdk.subscribe('stream-notify-logged', 'updateAvatar');
	// RC 0.58.0
	this.sdk.subscribe('stream-notify-logged', 'Users:NameChanged');
}

let ids = [];

export default async function getUsersPresence() {
	const serverVersion = reduxStore.getState().server.version;
	const { user: loggedUser } = reduxStore.getState().login;

	// if server is greather than or equal 1.1.0
	if (serverVersion && semver.gte(serverVersion, '1.1.0')) {
		let params = {};

		// if server is greather than or equal 3.0.0
		if (serverVersion && semver.gte(serverVersion, '3.0.0')) {
			// if not have any id
			if (!ids.length) {
				return;
			}
			// Request userPresence on demand
			params = { ids: ids.join(',') };
		}

		try {
			// RC 1.1.0
			const result = await this.sdk.get('users.presence', params);
			if (result.success) {
				const { users } = result;

				const activeUsers = users.reduce((ret, item) => {
					const { _id, status, statusText } = item;

					if (loggedUser && loggedUser.id === _id) {
						reduxStore.dispatch(setUser({ status, statusText }));
					}

					ret[_id] = { status, statusText };
					return ret;
				}, {});
				InteractionManager.runAfterInteractions(() => {
					reduxStore.dispatch(setActiveUsers(activeUsers));
				});
				ids = [];

				const db = database.active;
				const userCollection = db.collections.get('users');
				users.forEach(async(user) => {
					try {
						const userRecord = await userCollection.find(user._id);
						await db.action(async() => {
							await userRecord.update((u) => {
								Object.assign(u, user);
							});
						});
					} catch (e) {
						// User not found
						await db.action(async() => {
							await userCollection.create((u) => {
								u._raw = sanitizedRaw({ id: user._id }, userCollection.schema);
								Object.assign(u, user);
							});
						});
					}
				});
			}
		} catch {
			// do nothing
		}
	}
}

let usersTimer = null;
export function getUserPresence(uid) {
	const auth = reduxStore.getState().login.isAuthenticated;

	if (!usersTimer) {
		usersTimer = setTimeout(() => {
			if (auth && ids.length) {
				getUsersPresence.call(this);
			}
			usersTimer = null;
		}, 2000);
	}

	if (uid) {
		ids.push(uid);
	}
}
