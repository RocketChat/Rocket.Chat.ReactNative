import EJSON from 'ejson';
import { AppState } from 'react-native';

import debounce from '../utils/debounce';
import log from '../utils/log';
// import { AppState, NativeModules } from 'react-native';
// const { WebSocketModule, BlobManager } = NativeModules;

// class WS extends WebSocket {
// 	_close(code?: number, reason?: string): void {
// 		if (Platform.OS === 'android') {
// 			WebSocketModule.close(code, reason, this._socketId);
// 		} else {
// 			WebSocketModule.close(this._socketId);
// 		}
//
// 		if (BlobManager.isAvailable && this._binaryType === 'blob') {
// 			BlobManager.removeWebSocketHandler(this._socketId);
// 		}
// 	}
// }

class EventEmitter {
	constructor() {
		this.events = {};
	}
	on(event, listener) {
		if (typeof this.events[event] !== 'object') {
			this.events[event] = [];
		}
		this.events[event].push(listener);
		return listener;
	}
	removeListener(event, listener) {
		if (typeof this.events[event] === 'object') {
			const idx = this.events[event].indexOf(listener);
			if (idx > -1) {
				this.events[event].splice(idx, 1);
			}
			if (this.events[event].length === 0) {
				delete this.events[event];
			}
		}
	}
	emit(event, ...args) {
		if (typeof this.events[event] === 'object') {
			this.events[event].forEach((listener) => {
				try {
					listener.apply(this, args);
				} catch (e) {
					log('EventEmitter.emit', e);
				}
			});
		}
	}
	once(event, listener) {
		return this.on(event, function g(...args) {
			this.removeListener(event, g);
			listener.apply(this, args);
		});
	}
}


export default class Socket extends EventEmitter {
	constructor(url, login) {
		super();
		this.state = 'active';
		this.lastping = new Date();
		this._login = login;
		this.url = url;// .replace(/^http/, 'ws');
		this.id = 0;
		this.subscriptions = {};
		this.ddp = new EventEmitter();
		this._logged = false;
		const waitTimeout = () => setTimeout(() => {
			// this.connection.ping();
			this.send({ msg: 'ping' }).catch(e => log('ping', e));
			this.timeout = setTimeout(() => this.reconnect(), 1000);
		}, 40000);
		const handlePing = () => {
			this.lastping = new Date();
			this.send({ msg: 'pong' }, true).catch(e => log('pong', e));
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = waitTimeout();
		};
		const handlePong = () => {
			this.lastping = new Date();
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = waitTimeout();
		};


		AppState.addEventListener('change', async(nextAppState) => {
			if (this.state && this.state.match(/inactive/) && nextAppState === 'active') {
				try {
					await this.send({ msg: 'ping' }, true);
					// this.connection.ping();
				} catch (e) {
					this.reconnect();
				}
			}
			if (this.state && this.state.match(/background/) && nextAppState === 'active') {
				this.emit('background');
			}
			this.state = nextAppState;
		});

		this.on('pong', handlePong);
		this.on('ping', handlePing);

		this.on('result', data => this.ddp.emit(data.id, { id: data.id, result: data.result, error: data.error }));
		this.on('ready', data => this.ddp.emit(data.subs[0], data));
		// this.on('error', () => this.reconnect());
		this.on('disconnected', debounce(() => this.reconnect(), 300));

		this.on('logged', () => {
			this._logged = true;
			Object.keys(this.subscriptions || {}).forEach((key) => {
				const { name, params } = this.subscriptions[key];
				this.subscriptions[key].unsubscribe().catch(e => log('this.on(logged) unsub', e));
				this.subscribe(name, ...params).catch(e => log('this.on(logged) sub', e));
			});
		});
		this.on('open', async() => {
			this._logged = false;
			this.send({ msg: 'connect', version: '1', support: ['1', 'pre2', 'pre1'] }).catch(e => log('this.on(open)', e));
		});

		this._connect().catch(e => log('ddp.constructor._connect', e));
	}
	check() {
		if (!this.lastping) {
			return false;
		}
		if ((Math.abs(this.lastping.getTime() - new Date().getTime()) / 1000) > 50) {
			return false;
		}
		return true;
	}
	async login(params) {
		try {
			this.emit('login', params);
			const result = await this.call('login', params);
			// this._login = { resume: result.token, ...result };
			this._login = { resume: result.token, ...result, ...params };
			this._logged = true;
			// this.emit('logged', result);
			this.emit('logged', this._login);
			return result;
		} catch (err) {
			const error = { ...err };
			if (/user not found/i.test(error.reason)) {
				error.error = 1;
				error.reason = 'User or Password incorrect';
				error.message = 'User or Password incorrect';
			}
			this.emit('loginError', error);
			return Promise.reject(error);
		}
	}
	async send(obj, ignore) {
		console.log('send');
		return new Promise((resolve, reject) => {
			this.id += 1;
			const id = obj.id || `ddp-react-native-${ this.id }`;
			// console.log('send', { ...obj, id });
			this.connection.send(EJSON.stringify({ ...obj, id }));
			if (ignore) {
				return;
			}
			const cancel = this.ddp.once('disconnected', reject);
			this.ddp.once(id, (data) => {
				// console.log(data);
				this.lastping = new Date();
				this.ddp.removeListener('disconnected', cancel);
				return (data.error ? reject(data.error) : resolve({ id, ...data }));
			});
		});
	}
	get status() {
		return this.connection && this.connection.readyState === 1 && this.check() && !!this._logged;
	}
	_close() {
		try {
			// this.connection && this.connection.readyState > 1 && this.connection.close && this.connection.close(300, 'disconnect');
			if (this.connection && this.connection.close) {
				this.connection.close();
				delete this.connection;
			}
		} catch (e) {
			// console.log(e);
		}
	}
	_connect() {
		return new Promise((resolve) => {
			this.lastping = new Date();
			this._close();
			clearInterval(this.reconnect_timeout);
			this.reconnect_timeout = setInterval(() => {
				if (!this.connection || this.connection.readyState > 1 || !this.check()) {
					this.reconnect();
				}
			}, 5000);
			this.connection = new WebSocket(`${ this.url }/websocket`, null);

			this.connection.onopen = async() => {
				this.emit('open');
				resolve();
				this.ddp.emit('open');
				if (this._login) {
					return this.login(this._login).catch(e => console.warn(e));
				}
			};
			this.connection.onclose = debounce((e) => {
				this.emit('disconnected', e);
			}, 300);
			this.connection.onmessage = (e) => {
				try {
					// console.log('received', e.data, e.target.readyState);
					const data = EJSON.parse(e.data);
					this.emit(data.msg, data);
					return data.collection && this.emit(data.collection, data);
				} catch (err) {
					log('EJSON parse', err);
				}
			};
		});
	}
	logout() {
		this._login = null;
		return this.call('logout')
			.catch(e => log('logout', e))
			.finally(() => this.subscriptions = {});
	}
	disconnect() {
		this._close();
		this._logged = false;
		this._login = null;
		this.subscriptions = {};
	}
	async reconnect() {
		if (this._timer) {
			return;
		}
		this._close();
		this._logged = false;

		this._timer = setTimeout(async() => {
			delete this._timer;
			try {
				await this._connect();
			} catch (e) {
				log('ddp.reconnect._connect', e);
			}
		}, 1000);
	}
	call(method, ...params) {
		return this.send({
			msg: 'method', method, params
		}).then(data => data.result || data.subs).catch((err) => {
			log('DDP call Error', err);
			if (err && /you've been logged out by the server/i.test(err.reason)) {
				return this.emit('forbidden');
			}
			return Promise.reject(err);
		});
	}
	unsubscribe(id) {
		if (!this.subscriptions[id]) {
			return Promise.reject(id);
		}
		delete this.subscriptions[id];
		return this.send({
			msg: 'unsub',
			id
		}).then(data => data.result || data.subs).catch((err) => {
			log('DDP unsubscribe Error', err);
			return Promise.reject(err);
		});
	}
	subscribe(name, ...params) {
		console.log(name, params);
		return this.send({
			msg: 'sub', name, params
		}).then(({ id }) => {
			const args = {
				id,
				name,
				params,
				unsubscribe: () => this.unsubscribe(id)
			};

			this.subscriptions[id] = args;
			// console.log(args);
			return args;
		}).catch((err) => {
			log('DDP subscribe Error', err);
			return Promise.reject(err);
		});
	}
}
