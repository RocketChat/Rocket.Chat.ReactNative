import database from './database';
import EventEmitter from '../utils/events';
import { useSsl } from '../utils/url';
import { disconnect, connectSuccess, connectRequest } from '../actions/connect';
import reduxStore from './createStore';

const CURRENT_SERVER = 'currentServer';

const Connect = {
    stopListener(listener) {
		return listener && listener.stop();
    },
    onStreamData(...args) {
		return this.rocketChatInstance.onStreamData(...args);
	},
    connect({ server, user, logoutOnError = false }) {
        return new Promise((resolve) => {
            if (!this.rocketChatInstance || this.rocketChatInstance.client.host !== server) {
                database.setActiveDB(server);
            }
            reduxStore.dispatch(connectRequest());

            if (this.connectTimeout) {
                clearTimeout(this.connectTimeout);
            }

            if (this.connectedListener) {
                this.connectedListener.then(this.stopListener);
            }

            if (this.closeListener) {
                this.closeListener.then(this.stopListener);
            }

            if (this.usersListener) {
                this.usersListener.then(this.stopListener);
            }

            if (this.notifyLoggedListener) {
                this.notifyLoggedListener.then(this.stopListener);
            }

            RocketChat.unsubscribeRooms();

            EventEmitter.emit('INQUIRY_UNSUBSCRIBE');

            if (this.rocketChatInstance) {
                this.rocketChatInstance.disconnect();
                this.rocketChatInstance = null;
            }

            if (this.code) {
                this.code = null;
            }

            this.rocketChatInstance = new RocketchatClient({ host: server, 
                                                             protocol: 'ddp', 
                                                             useSsl: useSsl(server) });
            RocketChat.getSettings();

            const sdkConnect = () => this.rocketChatInstance.connect()
                .then(() => {
                    const { server: currentServer } = reduxStore.getState().server;
                    if (user && user.token && server === currentServer) {
                        reduxStore.dispatch(loginRequest({ resume: user.token }, logoutOnError));
                    }
                })
                .catch((err) => {
                    console.log('connect error', err);

                    // when `connect` raises an error, we try again in 10 seconds
                    this.connectTimeout = setTimeout(() => {
                        if (this.rocketChatInstance?.client?.host === server) {
                            sdkConnect();
                        }
                    }, 10000);
                });

            sdkConnect();

            this.connectedListener = this.rocketChatInstance.onStreamData('connected', () => {
                reduxStore.dispatch(connectSuccess());
            });

            this.closeListener = this.rocketChatInstance.onStreamData('close', () => {
                reduxStore.dispatch(disconnect());
            });

            this.usersListener = this.rocketChatInstance.onStreamData('users', 
                                    protectedFunction(ddpMessage => RocketChat._setUser(ddpMessage)));

            this.notifyLoggedListener = this.rocketChatInstance.onStreamData('stream-notify-logged', 
            protectedFunction(async(ddpMessage) => {
                const { eventName } = ddpMessage.fields;
                if (/user-status/.test(eventName)) {
                    this.activeUsers = this.activeUsers || {};
                    // Check if timer has ran out if it exists
                    if (!this._setUserTimer) {
                        this._setUserTimer = setTimeout(() => {
                            const activeUsersBatch = this.activeUsers;
                            InteractionManager.runAfterInteractions(() => {
                                reduxStore.dispatch(setActiveUsers(activeUsersBatch));
                            });
                            this._setUserTimer = null;
                            return this.activeUsers = {};
                        }, 10000);
                    }
                    const userStatus = ddpMessage.fields.args[0];
                    const [id,, status, statusText] = userStatus;
                    this.activeUsers[id] = { status: STATUSES[status], statusText };

                    const { user: loggedUser } = reduxStore.getState().login;
                    if (loggedUser && loggedUser.id === id) {
                        reduxStore.dispatch(setUser({ status: STATUSES[status], statusText }));
                    }
                } else if (/updateAvatar/.test(eventName)) {
                    const { username, etag } = ddpMessage.fields.args[0];
                    const db = database.active;
                    const userCollection = db.collections.get('users');
                    try {
                        const [userRecord] = await userCollection.query(Q.where('username', 
                                                                        Q.eq(username))).fetch();
                        await db.action(async() => {
                            await userRecord.update((u) => {
                                u.avatarETag = etag;
                            });
                        });
                    } catch {
                        // We can't create a new record since we don't receive the user._id
                    }
                } else if (/Users:NameChanged/.test(eventName)) {
                    const userNameChanged = ddpMessage.fields.args[0];
                    const db = database.active;
                    const userCollection = db.collections.get('users');
                    try {
                        const userRecord = await userCollection.find(userNameChanged._id);
                        await db.action(async() => {
                            await userRecord.update((u) => {
                                Object.assign(u, userNameChanged);
                            });
                        });
                    } catch {
                        // User not found
                        await db.action(async() => {
                            await userCollection.create((u) => {
                                u._raw = sanitizedRaw({ id: userNameChanged._id }, userCollection.schema);
                                Object.assign(u, userNameChanged);
                            });
                        });
                    }
                }
            }));

            resolve();
        });
    }
}

export default Connection;