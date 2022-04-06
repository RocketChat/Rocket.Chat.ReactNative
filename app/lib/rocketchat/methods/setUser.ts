import { InteractionManager } from 'react-native';

import { setActiveUsers } from '../../../actions/activeUsers';
import { setUser } from '../../../actions/login';
import { store as reduxStore } from '../../auxStore';
import { compareServerVersion } from '../../methods/helpers/compareServerVersion';

// TODO
export function _setUser(this: any, ddpMessage: { fields: any; id: any; cleared: any }) {
	this.activeUsers = this.activeUsers || {};
	const { user } = reduxStore.getState().login;

	if (ddpMessage.fields && user && user.id === ddpMessage.id) {
		reduxStore.dispatch(setUser(ddpMessage.fields));
	}

	if (ddpMessage.cleared && user && user.id === ddpMessage.id) {
		reduxStore.dispatch(setUser({ status: 'offline' }));
	}

	const serverVersion = reduxStore.getState().server.version;
	if (compareServerVersion(serverVersion, 'lowerThan', '4.1.0')) {
		if (!this._setUserTimer) {
			this._setUserTimer = setTimeout(() => {
				const activeUsersBatch = this.activeUsers;
				InteractionManager.runAfterInteractions(() => {
					reduxStore.dispatch(setActiveUsers(activeUsersBatch));
				});
				this._setUserTimer = null;
				return (this.activeUsers = {});
			}, 10000);
		}
	}

	if (!ddpMessage.fields) {
		this.activeUsers[ddpMessage.id] = { status: 'offline' };
	} else if (ddpMessage.fields.status) {
		this.activeUsers[ddpMessage.id] = { status: ddpMessage.fields.status };
	}
}
