import { InteractionManager } from 'react-native';

import { setActiveUsers } from '../../actions/activeUsers';
import { setUser } from '../../actions/login';
import { IUser } from '../../definitions';
import { store as reduxStore } from '../store/auxStore';
import { compareServerVersion } from './helpers';

export interface IActiveUsers {
	[key: string]: { status: string; statusText?: string } | string | boolean;
	msg: string;
	collection: string;
	id: string;
	cleared: boolean;
	fields: {
		emails: {
			address: string;
			verified: boolean;
		}[];
		username: string;
		status: string;
	};
}

export const _activeUsers = { activeUsers: {} as IActiveUsers };
export const _setUserTimer: { setUserTimer: null | ReturnType<typeof setTimeout> } = { setUserTimer: null };

export function _setUser(ddpMessage: IActiveUsers): void {
	_activeUsers.activeUsers = _activeUsers.activeUsers || {};
	const { user } = reduxStore.getState().login;

	if (ddpMessage.fields && user && user.id === ddpMessage.id) {
		reduxStore.dispatch(setUser(ddpMessage.fields as Partial<IUser>));
	}

	if (ddpMessage.cleared && user && user.id === ddpMessage.id) {
		reduxStore.dispatch(setUser({ status: 'offline' }));
	}

	const serverVersion = reduxStore.getState().server.version;
	if (compareServerVersion(serverVersion, 'lowerThan', '4.1.0')) {
		if (!_setUserTimer.setUserTimer) {
			_setUserTimer.setUserTimer = setTimeout(() => {
				const activeUsersBatch = _activeUsers.activeUsers;
				InteractionManager.runAfterInteractions(() => {
					// @ts-ignore
					reduxStore.dispatch(setActiveUsers(activeUsersBatch));
				});
				_setUserTimer.setUserTimer = null;
				_activeUsers.activeUsers = {} as IActiveUsers;
			}, 10000);
		}
	}

	if (!ddpMessage.fields) {
		_activeUsers.activeUsers[ddpMessage.id] = { status: 'offline' };
	} else if (ddpMessage.fields.status) {
		_activeUsers.activeUsers[ddpMessage.id] = { status: ddpMessage.fields.status };
	}
}
