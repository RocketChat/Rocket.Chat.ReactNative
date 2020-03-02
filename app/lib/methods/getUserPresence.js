import { InteractionManager } from 'react-native';
import semver from 'semver';

import reduxStore from '../createStore';
import { setActiveUsers } from '../../actions/activeUsers';

export async function getUsersPresence({ ids }) {
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
		// Request userPresence on demand
		const params = {
			ids: ids.join(',')
		};
		// if (this.lastUserPresenceFetch) {
		// 	params.from = this.lastUserPresenceFetch.toISOString();
		// }

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
			this.sdk.subscribe('stream-notify-logged', 'user-status');
		}
	}
}

let users = [];
let usersTimer = null;
export default function getUserPresence({ uid }) {
	if (!usersTimer) {
		usersTimer = setTimeout(() => {
			getUsersPresence.call(this, { ids: users });
			users = [];
			usersTimer = null;
		}, 1000);
	}
	users.push(uid);
}
