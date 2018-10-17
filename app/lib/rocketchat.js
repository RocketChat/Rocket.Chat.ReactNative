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
	setUser, setLoginServices, removeLoginServices, loginRequest, loginSuccess, loginFailure, logout
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
		return (headers['x-instance-id'] != null && headers['x-instance-id'].length > 0) || (headers['X-Instance-ID'] != null && headers['X-Instance-ID'].length > 0);
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
	async loginSuccess(user) {
		try {
			if (!user) {
				const { user: u } = reduxStore.getState().login;
				user = Object.assign({}, u);
			}

			// TODO: one api call
			// call /me only one time
			if (!user.username) {
				const me = await SDK.api.get('me');
				user = { ...user, ...me };
			}
			if (user.username) {
				const userInfo = await SDK.api.get('users.info', { userId: user.id });
				user = { ...user, ...userInfo.user };
			}

			RocketChat.registerPushToken(user.id);
			reduxStore.dispatch(setUser(user));
			reduxStore.dispatch(loginSuccess(user));
			this.ddp.subscribe('userData');
		} catch (e) {
			log('SDK.loginSuccess', e);
		}
	},
	connect(url, login) {
		return new Promise(async() => {
			if (this.ddp) {
				RocketChat.disconnect();
				this.ddp = null;
			}

			if (login) {
				SDK.api.setAuth({ authToken: login.token, userId: login.id });
			}

			SDK.api.setBaseUrl(url);
			SDK.driver.connect({ host: url, useSsl: true }, (err, ddp) => {
				if (err) {
					return console.warn(err);
				}
				this.ddp = ddp;
				if (login) {
					SDK.driver.login({ resume: login.resume });
				}
			});

			SDK.driver.on('connected', () => {
				reduxStore.dispatch(connectSuccess());
				SDK.driver.subscribe('meteor.loginServiceConfiguration');
				SDK.driver.subscribe('activeUsers');
				SDK.driver.subscribe('roles');
				RocketChat.getSettings();
				RocketChat.getPermissions();
				RocketChat.getCustomEmoji();
			});

			SDK.driver.on('login', protectedFunction(() => reduxStore.dispatch(loginRequest())));

			SDK.driver.on('forbidden', protectedFunction(() => reduxStore.dispatch(logout())));

			SDK.driver.on('users', protectedFunction((error, ddpMessage) => RocketChat._setUser(ddpMessage)));

			// SDK.driver.on('background', () => this.getRooms().catch(e => log('background getRooms', e)));

			SDK.driver.on('logged', protectedFunction((error, user) => {
				SDK.api.setAuth({ authToken: user.token, userId: user.id });
				SDK.api.currentLogin = {
					userId: user.id,
					authToken: user.token
				};
				this.loginSuccess(user);
				this.getRooms().catch(e => log('logged getRooms', e));
				this.subscribeRooms(user.id);
			}));

			SDK.driver.on('disconnected', protectedFunction(() => {
				reduxStore.dispatch(disconnect());
			}));

			SDK.driver.on('stream-room-messages', (error, ddpMessage) => {
				// TODO: debounce
				const message = _buildMessage(ddpMessage.fields.args[0]);
				requestAnimationFrame(() => reduxStore.dispatch(roomMessageReceived(message)));
			});

			SDK.driver.on('stream-notify-room', protectedFunction((error, ddpMessage) => {
				const [_rid, ev] = ddpMessage.fields.eventName.split('/');
				if (ev === 'typing') {
					reduxStore.dispatch(someoneTyping({ _rid, username: ddpMessage.fields.args[0], typing: ddpMessage.fields.args[1] }));
				} else if (ev === 'deleteMessage') {
					database.write(() => {
						if (ddpMessage && ddpMessage.fields && ddpMessage.fields.args.length > 0) {
							const { _id } = ddpMessage.fields.args[0];
							const message = database.objects('messages').filtered('_id = $0', _id);
							database.delete(message);
						}
					});
				}
			}));

			SDK.driver.on('rocketchat_starred_message', protectedFunction((error, ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.starredMessages = this.starredMessages || [];

					if (this.starredMessagesTimer) {
						clearTimeout(this.starredMessagesTimer);
						this.starredMessagesTimer = null;
					}

					this.starredMessagesTimer = setTimeout(protectedFunction(() => {
						reduxStore.dispatch(starredMessagesReceived(this.starredMessages));
						this.starredMessagesTimer = null;
						return this.starredMessages = [];
					}), 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const starredMessage = _buildMessage(message);
					this.starredMessages = [...this.starredMessages, starredMessage];
				}
				if (ddpMessage.msg === 'removed') {
					if (reduxStore.getState().starredMessages.isOpen) {
						return reduxStore.dispatch(starredMessageUnstarred(ddpMessage.id));
					}
				}
			}));

			SDK.driver.on('rocketchat_pinned_message', protectedFunction((error, ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.pinnedMessages = this.pinnedMessages || [];

					if (this.pinnedMessagesTimer) {
						clearTimeout(this.pinnedMessagesTimer);
						this.pinnedMessagesTimer = null;
					}

					this.pinnedMessagesTimer = setTimeout(() => {
						reduxStore.dispatch(pinnedMessagesReceived(this.pinnedMessages));
						this.pinnedMessagesTimer = null;
						return this.pinnedMessages = [];
					}, 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const pinnedMessage = _buildMessage(message);
					this.pinnedMessages = [...this.pinnedMessages, pinnedMessage];
				}
				if (ddpMessage.msg === 'removed') {
					if (reduxStore.getState().pinnedMessages.isOpen) {
						return reduxStore.dispatch(pinnedMessageUnpinned(ddpMessage.id));
					}
				}
			}));

			SDK.driver.on('rocketchat_mentioned_message', protectedFunction((error, ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.mentionedMessages = this.mentionedMessages || [];

					if (this.mentionedMessagesTimer) {
						clearTimeout(this.mentionedMessagesTimer);
						this.mentionedMessagesTimer = null;
					}

					this.mentionedMessagesTimer = setTimeout(() => {
						reduxStore.dispatch(mentionedMessagesReceived(this.mentionedMessages));
						this.mentionedMessagesTimer = null;
						return this.mentionedMessages = [];
					}, 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const mentionedMessage = _buildMessage(message);
					this.mentionedMessages = [...this.mentionedMessages, mentionedMessage];
				}
			}));

			SDK.driver.on('rocketchat_snippeted_message', protectedFunction((error, ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.snippetedMessages = this.snippetedMessages || [];

					if (this.snippetedMessagesTimer) {
						clearTimeout(this.snippetedMessagesTimer);
						this.snippetedMessagesTimer = null;
					}

					this.snippetedMessagesTimer = setTimeout(() => {
						reduxStore.dispatch(snippetedMessagesReceived(this.snippetedMessages));
						this.snippetedMessagesTimer = null;
						return this.snippetedMessages = [];
					}, 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const snippetedMessage = _buildMessage(message);
					this.snippetedMessages = [...this.snippetedMessages, snippetedMessage];
				}
			}));

			SDK.driver.on('room_files', protectedFunction((error, ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.roomFiles = this.roomFiles || [];

					if (this.roomFilesTimer) {
						clearTimeout(this.roomFilesTimer);
						this.roomFilesTimer = null;
					}

					this.roomFilesTimer = setTimeout(() => {
						reduxStore.dispatch(roomFilesReceived(this.roomFiles));
						this.roomFilesTimer = null;
						return this.roomFiles = [];
					}, 1000);
					const { fields } = ddpMessage;
					const message = {
						_id: ddpMessage.id,
						ts: fields.uploadedAt,
						msg: fields.description,
						status: 0,
						attachments: [{
							title: fields.name
						}],
						urls: [],
						reactions: [],
						u: {
							username: fields.user.username
						}
					};
					const fileUrl = `/file-upload/${ ddpMessage.id }/${ fields.name }`;
					if (/image/.test(fields.type)) {
						message.attachments[0].image_type = fields.type;
						message.attachments[0].image_url = fileUrl;
					} else if (/audio/.test(fields.type)) {
						message.attachments[0].audio_type = fields.type;
						message.attachments[0].audio_url = fileUrl;
					} else if (/video/.test(fields.type)) {
						message.attachments[0].video_type = fields.type;
						message.attachments[0].video_url = fileUrl;
					}
					this.roomFiles = [...this.roomFiles, message];
				}
			}));

			SDK.driver.on('meteor_accounts_loginServiceConfiguration', (error, ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.loginServices = this.loginServices || {};
					if (this.loginServiceTimer) {
						clearTimeout(this.loginServiceTimer);
						this.loginServiceTimer = null;
					}
					this.loginServiceTimer = setTimeout(() => {
						reduxStore.dispatch(setLoginServices(this.loginServices));
						this.loginServiceTimer = null;
						return this.loginServices = {};
					}, 1000);
					this.loginServices[ddpMessage.fields.service] = { ...ddpMessage.fields };
					delete this.loginServices[ddpMessage.fields.service].service;
				} else if (ddpMessage.msg === 'removed') {
					if (this.loginServiceTimer) {
						clearTimeout(this.loginServiceTimer);
					}
					this.loginServiceTimer = setTimeout(() => reduxStore.dispatch(removeLoginServices()), 1000);
				}
			});

			SDK.driver.on('rocketchat_roles', protectedFunction((error, ddpMessage) => {
				this.roles = this.roles || {};

				if (this.roleTimer) {
					clearTimeout(this.roleTimer);
					this.roleTimer = null;
				}
				this.roleTimer = setTimeout(() => {
					reduxStore.dispatch(setRoles(this.roles));

					database.write(() => {
						foreach(this.roles, (description, _id) => {
							database.create('roles', { _id, description }, true);
						});
					});

					this.roleTimer = null;
					return this.roles = {};
				}, 1000);
				this.roles[ddpMessage.id] = (ddpMessage.fields && ddpMessage.fields.description) || undefined;
			}));

			// SDK.driver.on('error', (err) => {
			// 	log('SDK.onerror', err);
			// 	reduxStore.dispatch(connectFailure());
			// });

			// SDK.driver.on('open', protectedFunction(() => {
			// 	RocketChat.getSettings();
			// 	RocketChat.getPermissions();
			// 	reduxStore.dispatch(connectSuccess());
			// 	resolve();
			// }));

			// this.ddp.once('open', protectedFunction(() => {
			// 	this.ddp.subscribe('activeUsers');
			// 	this.ddp.subscribe('roles');
			// 	RocketChat.getCustomEmoji();
			// }));
		}).catch((e) => {
			log('SDK.connect catch', e);
		});
	},

	register({ credentials }) {
		return call('registerUser', credentials);
	},

	setUsername({ credentials }) {
		return call('setUsername', credentials.username);
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
		try {
			await SDK.driver.login(params);
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
		setTimeout(() => {
			database.deleteAll();
		}, 1500);
	},
	disconnect() {
		try {
			SDK.driver.unsubscribeAll();
		} catch (error) {
			console.warn(error);
		}
		SDK.api.setAuth({ authToken: null, userId: null });
		SDK.api.currentLogin = {
			userId: null,
			authToken: null
		};
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
		return _sendMessageCall(JSON.parse(JSON.stringify(message)));
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
	_filterSettings: settings => settings.filter(setting => defaultSettings[setting._id] && setting.value),
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
	leaveRoom(rid) {
		return call('leaveRoom', rid);
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
	saveNotificationSettings(rid, param, value) {
		return call('saveNotificationSettings', rid, param, value);
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
	}
};

export default RocketChat;
