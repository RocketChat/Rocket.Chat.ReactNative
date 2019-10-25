import RNUserDefaults from 'rn-user-defaults';
import EJSON from 'ejson';

import PushNotification from './push';
import random from '../../utils/random';
import store from '../../lib/createStore';
import { deepLinkingOpen } from '../../actions/deepLinking';
import { SERVERS, TOKEN, SERVER_URL } from '../../constants/userDefaults';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';

const handleReply = async(action, host, rid) => {
	if (action) {
		const { text } = action;
		let user = {};
		const userId = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ host }`);
		if (userId) {
			try {
				const serversDB = database.servers;
				const userCollections = serversDB.collections.get('users');
				const userRecord = await userCollections.find(userId);
				user = {
					id: userRecord.id,
					token: userRecord.token
				};
			} catch (e) {
				// We only run it if not has user on DB
				const servers = await RNUserDefaults.objectForKey(SERVERS);
				const userCredentials = servers && servers.find(srv => srv[SERVER_URL] === host);
				user = userCredentials && {
					id: userId,
					token: userCredentials[TOKEN]
				};
			}
		}
		fetch(`${ host }/api/v1/chat.sendMessage`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-auth-token': user.token,
				'x-user-id': user.id
			},
			body: JSON.stringify({
				message: {
					_id: random(17),
					rid,
					msg: text,
					tmid: null
				}
			})
		});
	}
};

export const onNotification = (notification, action) => {
	if (notification) {
		const data = notification.getData();

		if (data) {
			try {
				const {
					rid, name, sender, type, host
				} = EJSON.parse(data.ejson);

				if (action) {
					handleReply(action, host, rid);
				} else {
					const types = {
						c: 'channel', d: 'direct', p: 'group'
					};
					const roomName = type === 'd' ? sender.username : name;
					const params = {
						host,
						rid,
						path: `${ types[type] }/${ roomName }`
					};
					store.dispatch(deepLinkingOpen(params));
				}
			} catch (e) {
				console.warn(e);
			}
		}
	}
};

export const getDeviceToken = () => PushNotification.getDeviceToken();
export const setBadgeCount = count => PushNotification.setBadgeCount(count);
export const initializePushNotifications = () => {
	setBadgeCount();
	return PushNotification.configure({
		onNotification
	});
};
