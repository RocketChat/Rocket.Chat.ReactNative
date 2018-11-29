import { AsyncStorage, Platform } from 'react-native';
import foreach from 'lodash/forEach';
import RNFetchBlob from 'rn-fetch-blob';
import * as SDK from '@rocket.chat/sdk';

import reduxStore from './createStore';
import defaultSettings from '../constants/settings';
import messagesStatus from '../constants/messagesStatus';
import database from './realm';
import log from '../utils/log';
// import * as actions from '../actions';

import {
	setUser, setLoginServices, loginRequest, loginSuccess, loginFailure, logout
} from '../actions/login';
import { disconnect, connectSuccess } from '../actions/connect';
import { setActiveUser } from '../actions/activeUsers';
import { starredMessagesReceived, starredMessageUnstarred } from '../actions/starredMessages';
import { pinnedMessagesReceived, pinnedMessageUnpinned } from '../actions/pinnedMessages';
import { mentionedMessagesReceived } from '../actions/mentionedMessages';
import { snippetedMessagesReceived } from '../actions/snippetedMessages';
import { roomFilesReceived } from '../actions/roomFiles';
import { someoneTyping, roomMessageReceived } from '../actions/room';
import { setRoles } from '../actions/roles';

import subscribeRooms from './methods/subscriptions/rooms';
import subscribeRoom from './methods/subscriptions/room';

import protectedFunction from './methods/helpers/protectedFunction';
import readMessages from './methods/readMessages';
import getSettings from './methods/getSettings';

import getRooms from './methods/getRooms';
import getPermissions from './methods/getPermissions';
import getCustomEmoji from './methods/getCustomEmojis';
import canOpenRoom from './methods/canOpenRoom';

import _buildMessage from './methods/helpers/buildMessage';
import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadMissedMessages from './methods/loadMissedMessages';

import sendMessage, { getMessage, _sendMessageCall } from './methods/sendMessage';
import { sendFileMessage, cancelUpload, isUploadActive } from './methods/sendFileMessage';

import { getDeviceToken } from '../push';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
const call = (method, ...params) => SDK.driver.asyncCall(method, ...params);
const returnAnArray = obj => obj || [];

const RocketChat = {
	TOKEN_KEY,
	subscribeRooms,
	subscribeRoom,
	canOpenRoom,
	createChannel({
		name, users, type, readOnly, broadcast
	}) {
		return call(type ? 'createPrivateGroup' : 'createChannel', name, users, readOnly, {}, { broadcast });
	},
	async createDirectMessageAndWait(username) {
		const room = await RocketChat.createDirectMessage(username);
		return new Promise((resolve) => {
			const data = database.objects('subscriptions')
				.filtered('rid = $1', room.rid);

			if (data.length) {
				return resolve(data[0]);
			}
			data.addListener(() => {
				if (!data.length) { return; }
				data.removeAllListeners();
				resolve(data[0]);
			});
		});
	},

	async getUserToken() {
		try {
			return await AsyncStorage.getItem(TOKEN_KEY);
		} catch (error) {
			console.warn(`AsyncStorage error: ${ error.message }`);
		}
	},
	_hasInstanceId(headers) {
		return !!headers[Object.keys(headers).find(item => item.toLowerCase() === 'x-instance-id')];
	},
	async testServer(url) {
		try {
			let response = await RNFetchBlob.fetch('HEAD', url);
			response = response.respInfo;
			if (response.status === 200 && RocketChat._hasInstanceId(response.headers)) {
				return url;
			}
		} catch (e) {
			log('testServer', e);
		}
		throw new Error({ error: 'invalid server' });
	},
	_setUser(ddpMessage) {
		this.activeUsers = this.activeUsers || {};
		const { user } = reduxStore.getState().login;

		if (ddpMessage.fields && user && user.id === ddpMessage.id) {
			reduxStore.dispatch(setUser(ddpMessage.fields));
		}

		if (this._setUserTimer) {
			clearTimeout(this._setUserTimer);
			this._setUserTimer = null;
		}

		this._setUserTimer = setTimeout(() => {
			reduxStore.dispatch(setActiveUser(this.activeUsers));
			this._setUserTimer = null;
			return this.activeUsers = {};
		}, 2000);

		const activeUser = reduxStore.getState().activeUsers[ddpMessage.id];
		if (!ddpMessage.fields) {
			this.activeUsers[ddpMessage.id] = {};
		} else {
			this.activeUsers[ddpMessage.id] = { ...this.activeUsers[ddpMessage.id], ...activeUser, ...ddpMessage.fields };
		}
	},
	// async loginSuccess(user) {
	// 	if (!user) {
	// 		const { user: u } = reduxStore.getState().login;
	// 		user = Object.assign({}, u);
	// 	}

	// 	// TODO: one api call
	// 	// call /me only one time
	// 	try {
	// 		if (!user.username) {
	// 			// get me from api
	// 			let me = await SDK.api.get('me');
	// 			// if server didn't found username
	// 			if (!me.username) {
	// 				// search username from credentials (sent during registerSubmit)
	// 				const { username } = reduxStore.getState().login.credentials;
	// 				if (username) {
	// 					// set username
	// 					await RocketChat.setUsername({ username });
	// 					me = { ...me, username };
	// 				}
	// 			}
	// 			user = { ...user, ...me };
	// 		}
	// 	} catch (e) {
	// 		log('SDK.loginSuccess set username', e);
	// 	}

	// 	try {
	// 		if (user.username) {
	// 			const userInfo = await SDK.api.get('users.info', { userId: user.id });
	// 			user = { ...user, ...userInfo.user };
	// 		}

	// 		RocketChat.registerPushToken(user.id);
	// 		reduxStore.dispatch(setUser(user));
	// 		reduxStore.dispatch(loginSuccess(user));
	// 		this.ddp.subscribe('userData');
	// 	} catch (e) {
	// 		log('SDK.loginSuccess', e);
	// 	}
	// },
	loginSuccess({ user }) {
		console.log("​loginSuccess -> user", user);
		reduxStore.dispatch(setUser(user));
		RocketChat.registerPushToken(user._id);

		// try {
		// 	const oauth = await this.sdk.get('settings.oauth')
		// } catch (error) {
		// 	console.log("​​start -> oauth -> error", error);
		// }

		// try {
		// 	const roles = await this.sdk.get('roles.list')
		// } catch (error) {
		// 	console.log("​​start -> roles -> error", error);
		// }

		this.getRooms().catch(e => console.log(e));
		this.getPermissions();
		this.getCustomEmoji();
		// this.sdk.subscribeNotifyUser().then(res => console.log(res)).catch(e => alert(e))
		// this.sdk.onNotifyUser(r => console.log(r))

		console.log('get activeusers')
	},
	connect({ server, token, user }) {
		console.log("​start -> server, token, user", server, token, user);
		database.setActiveDB(server);

		// TODO: remove old this.sdk when changing servers
		if (this.ddp) {
			RocketChat.disconnect();
			this.ddp = null;
		}

		SDK.api.setBaseUrl(server);
		this.getSettings();

		if (token) {
			reduxStore.dispatch(loginRequest({ resume: token }));
		}

		SDK.driver.connect({ host: server, useSsl: true }, (err, ddp) => {
			if (err) {
				return console.warn(err);
			}
			this.ddp = ddp;
			if (token) {
				SDK.driver.login({ resume: token });
			}
		});

		SDK.driver.on('connected', () => {
			reduxStore.dispatch(connectSuccess());
		});

		SDK.driver.on('logged', protectedFunction((error, u) => {
			this.subscribeRooms(u.id);
			SDK.driver.subscribe('activeUsers');
			SDK.driver.subscribe('roles');
		}));

		SDK.driver.on('forbidden', protectedFunction(() => reduxStore.dispatch(logout())));

		SDK.driver.on('users', protectedFunction((error, ddpMessage) => RocketChat._setUser(ddpMessage)));
	},
	connected() {
		return SDK.driver.ddp && SDK.driver.ddp._logged;
	},

	register({ credentials }) {
		return call('registerUser', credentials);
	},

	setUsername({ username }) {
		return call('setUsername', username);
	},

	forgotPassword(email) {
		return call('sendForgotPasswordEmail', email);
	},

	async loginWithPassword({ username, password, code }) {
		let params = { username, password };
		const state = reduxStore.getState();

		if (state.settings.LDAP_Enable) {
			params = {
				...params,
				ldap: true,
				ldapOptions: {}
			};
		} else if (state.settings.CROWD_Enable) {
			params = {
				...params,
				crowd: true
			};
		} else if (typeof username === 'string' && username.indexOf('@') !== -1) {
			params.email = username;
			delete params.username;
		}

		if (code) {
			params = {
				...params,
				code,
				totp: true
			};
		}

		try {
			return await this.login(params);
		} catch (error) {
			throw error;
		}
	},

	async login(params) {
		console.log("​login -> params", params);
		console.log("​login -> SDK.api", SDK.api);
		try {
			// await SDK.driver.login(params);
			return await SDK.api.login(params);
		} catch (e) {
			reduxStore.dispatch(loginFailure(e));
			throw e;
		}
	},
	logout({ server }) {
		try {
			RocketChat.disconnect();
			SDK.driver.logout();
		} catch (error) {
			console.warn(error);
		}
		AsyncStorage.removeItem(TOKEN_KEY);
		AsyncStorage.removeItem(`${ TOKEN_KEY }-${ server }`);
		try {
			database.deleteAll();
		} catch (error) {
			console.warn(error);
		}
	},
	disconnect() {
		try {
			SDK.driver.unsubscribeAll();
		} catch (error) {
			console.warn(error);
		}
		RocketChat.setApiUser({ userId: null, authToken: null });
	},
	setApiUser({ userId, authToken }) {
		SDK.api.setAuth({ userId, authToken });
		SDK.api.currentLogin = { userId, authToken };
	},
	registerPushToken(userId) {
		const deviceToken = getDeviceToken();
		if (deviceToken) {
			const key = Platform.OS === 'ios' ? 'apn' : 'gcm';
			const data = {
				id: `RocketChatRN${ userId }`,
				token: { [key]: deviceToken },
				appName: 'chat.rocket.reactnative', // TODO: try to get from config file
				userId,
				metadata: {}
			};
			return call('raix:push-update', data);
		}
	},

	// updatePushToken(pushId) {
	// 	return call('raix:push-setuser', pushId);
	// },
	loadMissedMessages,
	loadMessagesForRoom,
	getMessage,
	sendMessage,
	getRooms,
	readMessages,
	async resendMessage(messageId) {
		const message = await database.objects('messages').filtered('_id = $0', messageId)[0];
		database.write(() => {
			message.status = messagesStatus.TEMP;
			database.create('messages', message, true);
		});
		return _sendMessageCall.call(this, JSON.parse(JSON.stringify(message)));
	},

	async search({ text, filterUsers = true, filterRooms = true }) {
		const searchText = text.trim();

		if (this.oldPromise) {
			this.oldPromise('cancel');
		}

		if (searchText === '') {
			delete this.oldPromise;
			return [];
		}

		let data = database.objects('subscriptions').filtered('name CONTAINS[c] $0', searchText);

		if (filterUsers && !filterRooms) {
			data = data.filtered('t = $0', 'd');
		} else if (!filterUsers && filterRooms) {
			data = data.filtered('t != $0', 'd');
		}
		data = data.slice(0, 7);
		const array = Array.from(data);
		data = JSON.parse(JSON.stringify(array));

		const usernames = data.map(sub => sub.name);
		try {
			if (data.length < 7) {
				const { users, rooms } = await Promise.race([
					RocketChat.spotlight(searchText, usernames, { users: filterUsers, rooms: filterRooms }),
					new Promise((resolve, reject) => this.oldPromise = reject)
				]);

				data = data.concat(users.map(user => ({
					...user,
					rid: user.username,
					name: user.username,
					t: 'd',
					search: true
				})), rooms.map(room => ({
					rid: room._id,
					...room,
					search: true
				})));
			}
			delete this.oldPromise;
			return data;
		} catch (e) {
			console.warn(e);
			return data;
			// return [];
		}
	},

	spotlight(search, usernames, type) {
		return call('spotlight', search, usernames, type);
	},

	createDirectMessage(username) {
		return call('createDirectMessage', username);
	},
	joinRoom(rid) {
		return call('joinRoom', rid);
	},
	sendFileMessage,
	cancelUpload,
	isUploadActive,
	getSettings,
	getPermissions,
	getCustomEmoji,
	parseSettings: settings => settings.reduce((ret, item) => {
		ret[item._id] = item[defaultSettings[item._id].type] || item.valueAsString || item.valueAsNumber
			|| item.valueAsBoolean || item.value;
		return ret;
	}, {}),
	_prepareSettings(settings) {
		return settings.map((setting) => {
			setting[defaultSettings[setting._id].type] = setting.value;
			return setting;
		});
	},
	parseEmojis: emojis => emojis.reduce((ret, item) => {
		ret[item.name] = item.extension;
		item.aliases.forEach((alias) => {
			ret[alias.value] = item.extension;
		});
		return ret;
	}, {}),
	_prepareEmojis(emojis) {
		emojis.forEach((emoji) => {
			emoji.aliases = emoji.aliases.map(alias => ({ value: alias }));
		});
		return emojis;
	},
	deleteMessage(message) {
		return call('deleteMessage', { _id: message._id });
	},
	editMessage(message) {
		const { _id, msg, rid } = message;
		return call('updateMessage', { _id, msg, rid });
	},
	toggleStarMessage(message) {
		return call('starMessage', { _id: message._id, rid: message.rid, starred: !message.starred });
	},
	togglePinMessage(message) {
		if (message.pinned) {
			return call('unpinMessage', message);
		}
		return call('pinMessage', message);
	},
	getRoom(rid) {
		const [result] = database.objects('subscriptions').filtered('rid = $0', rid);
		if (!result) {
			return Promise.reject(new Error('Room not found'));
		}
		return Promise.resolve(result);
	},
	async getPermalink(message) {
		let room;
		try {
			room = await RocketChat.getRoom(message.rid);
		} catch (e) {
			log('SDK.getPermalink', e);
			return null;
		}
		const { server } = reduxStore.getState().server;
		const roomType = {
			p: 'group',
			c: 'channel',
			d: 'direct'
		}[room.t];
		return `${ server }/${ roomType }/${ room.name }?msg=${ message._id }`;
	},
	subscribe(...args) {
		return SDK.driver.subscribe(...args);
	},
	unsubscribe(subscription) {
		return SDK.driver.unsubscribe(subscription);
	},
	emitTyping(room, t = true) {
		const { login } = reduxStore.getState();
		return call('stream-notify-room', `${ room }/typing`, login.user.username, t);
	},
	setUserPresenceAway() {
		return call('UserPresence:away');
	},
	setUserPresenceOnline() {
		return call('UserPresence:online');
	},
	setUserPresenceDefaultStatus(status) {
		return call('UserPresence:setDefaultStatus', status);
	},
	setReaction(emoji, messageId) {
		return call('setReaction', emoji, messageId);
	},
	toggleFavorite(rid, f) {
		return call('toggleFavorite', rid, !f);
	},
	getRoomMembers(rid, allUsers) {
		return call('getUsersOfRoom', rid, allUsers);
	},
	getUserRoles() {
		return call('getUserRoles');
	},
	getRoomCounters(roomId, t) {
		return SDK.api.get(`${ this.roomTypeToApiType(t) }.counters`, { roomId });
	},
	async getRoomMember(rid, currentUserId) {
		try {
			const membersResult = await RocketChat.getRoomMembers(rid, true);
			return Promise.resolve(membersResult.records.find(m => m.id !== currentUserId));
		} catch (error) {
			return Promise.reject(error);
		}
	},
	toggleBlockUser(rid, blocked, block) {
		if (block) {
			return call('blockUser', { rid, blocked });
		}
		return call('unblockUser', { rid, blocked });
	},
	leaveRoom(roomId, t) {
		console.log("​leaveRoom -> roomId, t", roomId, t);
		return SDK.api.post(`${ this.roomTypeToApiType(t) }.leave`, { roomId });
		// return call('leaveRoom', rid);
	},
	eraseRoom(rid) {
		return call('eraseRoom', rid);
	},
	toggleMuteUserInRoom(rid, username, mute) {
		if (mute) {
			return call('muteUserInRoom', { rid, username });
		}
		return call('unmuteUserInRoom', { rid, username });
	},
	toggleArchiveRoom(rid, archive) {
		if (archive) {
			return call('archiveRoom', rid);
		}
		return call('unarchiveRoom', rid);
	},
	saveRoomSettings(rid, params) {
		return call('saveRoomSettings', rid, params);
	},
	saveUserProfile(params, customFields) {
		return call('saveUserProfile', params, customFields);
	},
	saveUserPreferences(params) {
		return call('saveUserPreferences', params);
	},
	saveNotificationSettings(roomId, notifications) {
		return SDK.api.post('rooms.saveNotification', { roomId, notifications });
	},
	messageSearch(text, rid, limit) {
		return call('messageSearch', text, rid, limit);
	},
	addUsersToRoom(rid) {
		let { users } = reduxStore.getState().selectedUsers;
		users = users.map(u => u.name);
		return call('addUsersToRoom', { rid, users });
	},
	hasPermission(permissions, rid) {
		// get the room from realm
		const room = database.objects('subscriptions').filtered('rid = $0', rid)[0];
		// get permissions from realm
		const permissionsFiltered = database.objects('permissions')
			.filter(permission => permissions.includes(permission._id));
		// get room roles
		const { roles } = room;
		// transform room roles to array
		const roomRoles = Array.from(Object.keys(roles), i => roles[i].value);
		// get user roles on the server from redux
		const userRoles = (reduxStore.getState().login.user && reduxStore.getState().login.user.roles) || [];
		// merge both roles
		const mergedRoles = [...new Set([...roomRoles, ...userRoles])];

		// return permissions in object format
		// e.g. { 'edit-room': true, 'set-readonly': false }
		return permissions.reduce((result, permission) => {
			result[permission] = false;
			const permissionFound = permissionsFiltered.find(p => p._id === permission);
			if (permissionFound) {
				result[permission] = returnAnArray(permissionFound.roles).some(r => mergedRoles.includes(r.value));
			}
			return result;
		}, {});
	},
	getAvatarSuggestion() {
		return call('getAvatarSuggestion');
	},
	resetAvatar() {
		return call('resetAvatar');
	},
	setAvatarFromService({ data, contentType = '', service = null }) {
		return call('setAvatarFromService', data, contentType, service);
	},
	async getSortPreferences() {
		const prefs = await AsyncStorage.getItem(SORT_PREFS_KEY);
		return JSON.parse(prefs);
	},
	async saveSortPreference(param) {
		try {
			let prefs = await RocketChat.getSortPreferences();
			prefs = { ...prefs, ...param };
			return await AsyncStorage.setItem(SORT_PREFS_KEY, JSON.stringify(prefs));
		} catch (error) {
			console.warn(error);
		}
	},
	async getLoginServices(server) {
		try {
			let loginServicesFilter = [];
			const loginServicesResult = await fetch(`${ server }/api/v1/settings.oauth`).then(response => response.json());
			// TODO: remove this after SAML and custom oauth
			const availableOAuth = ['facebook', 'github', 'gitlab', 'google', 'linkedin', 'meteor-developer', 'twitter'];
			if (loginServicesResult.success && loginServicesResult.services.length > 0) {
				const { services } = loginServicesResult;
				loginServicesFilter = services.filter(item => availableOAuth.includes(item.name));
				const loginServicesReducer = loginServicesFilter.reduce((ret, item) => {
					ret[item.name] = item;
					return ret;
				}, {});
				reduxStore.dispatch(setLoginServices(loginServicesReducer));
			}
			return Promise.resolve(loginServicesFilter.length);
		} catch (error) {
			console.warn(error);
			return Promise.reject();
		}
	},
	getUsernameSuggestion() {
		return SDK.driver.asyncCall('getUsernameSuggestion');
	},
	clearAsyncStorage(server) {
		const promises = [
			AsyncStorage.removeItem(RocketChat.TOKEN_KEY),
			AsyncStorage.removeItem('currentServer')
		];
		// TODO: need this?
		if (server) {
			promises.push(AsyncStorage.removeItem(`${ RocketChat.TOKEN_KEY }-${ server }`));
		}
		return Promise.all(promises);
	},
	roomTypeToApiType(t) {
		const types = {
			c: 'channels', d: 'im', p: 'groups'
		};
		return types[t];
	}
};

export default RocketChat;
