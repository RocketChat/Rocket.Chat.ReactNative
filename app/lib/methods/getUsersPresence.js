import { InteractionManager } from 'react-native';
import semver from 'semver';

import reduxStore from '../createStore';
import { setActiveUsers } from '../../actions/activeUsers';

export function subscribeUsersPresence() {
	const serverVersion = reduxStore.getState().server.version;

	// if server is lower than 1.1.0
	if (serverVersion && semver.lt(semver.coerce(serverVersion), '1.1.0')) {
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
}

let ids = [];

export default async function getUsersPresence() {
	const serverVersion = reduxStore.getState().server.version;

	// if server is greather than or equal 1.1.0
	if (serverVersion && !semver.lt(semver.coerce(serverVersion), '1.1.0')) {
		let params = {};

		// if server is greather than or equal 3.0.0
		if (serverVersion && !semver.lt(semver.coerce(serverVersion), '3.0.0')) {
			// if not have any id
			if (!ids.length) {
				return;
			}
			// Request userPresence on demand
			params = { ids: ids.join(',') };
			ids = [];
		}

		// RC 1.1.0
		const result = await this.sdk.get('users.presence', params);
		if (result.success) {
			const activeUsers = result.users.reduce((ret, item) => {
				ret[item._id] = item.status;
				return ret;
			}, {});
			InteractionManager.runAfterInteractions(() => {
				reduxStore.dispatch(setActiveUsers(activeUsers));
			});
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

	ids.push(uid);
}
