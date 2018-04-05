import EJSON from 'ejson';
import { Answers } from 'react-native-fabric';

class EventEmitter {
	constructor() {
		this.events = {};
	}
	on(event, listener) {
		if (typeof this.events[event] !== 'object') {
			this.events[event] = [];
		}
		this.events[event].push(listener);
	}
	removeListener(event, listener) {
		if (typeof this.events[event] === 'object') {
			const idx = this.events[event].indexOf(listener);
			if (idx > -1) {
				this.events[event].splice(idx, 1);
			}
		}
	}
	emit(event, ...args) {
		if (typeof this.events[event] === 'object') {
			this.events[event].forEach((listener) => {
				try {
					listener.apply(this, args);
				} catch (e) {
					Answers.logCustom(e);
					console.log(e);
				}
			});
		}
	}
	once(event, listener) {
		this.on(event, function g(...args) {
			this.removeListener(event, g);
			listener.apply(this, args);
		});
	}
}

export default class Socket extends EventEmitter {
	constructor(url, login) {
		super();
		this.lastping = null;
		this._login = login;
		this.url = url.replace(/^http/, 'ws');
		this.id = 0;
		this.subscriptions = {};
		this.ddp = new EventEmitter();
		this._logged = false;

		this.on('ping', () => {
			this.lastping = new Date();
			this.send({ msg: 'pong' });
			if (this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			this.timeout = setTimeout(() => this.reconnect(), 35000);
		});

		this.on('result', data => this.ddp.emit(data.id, { id: data.id, result: data.result, error: data.error }));
		this.on('ready', data => this.ddp.emit(data.subs[0], data));
		this.on('disconnected', () => { delete this.connection; this._logged = false; this.reconnect(); });
		this.on('logged', () => this._logged = true);

		this.on('open', async() => {
			this.send({ msg: 'connect', version: '1', support: ['1', 'pre2', 'pre1'] });
		});

		this._connect();
	}
	async login(params) {
		try {
			this.emit('login', params);
			const result = await this.call('login', params);
			this._login = { resume: result.token, ...result };
			this.emit('logged', result);
			return result;
		} catch (err) {
			if (/user not found/i.test(err.reason)) {
				err.error = 1;
				err.reason = 'User or Password incorrect';
				err.message = 'User or Password incorrect';
			}
			this.emit('logginError', err);
			return Promise.reject(err);
		}
	}
	async send(obj) {
		// TODO: reject on disconnect
		return new Promise((resolve, reject) => {
			this.id += 1;
			const id = obj.id || `${ this.id }`;
			this.connection.send(EJSON.stringify({ ...obj, id }));
			this.ddp.once(id, data => (data.error ? reject(data.error) : resolve({ id, ...data })));
		});
	}
	_close() {
		console.log(new Error().stack);
		try {
			// this.connection && this.connection.readyState > 1 && this.connection.close && this.connection.close(300, 'disconnect');
			if (this.connection && this.connection.readyState > 1 && this.connection.close) {
				this.connection.close(300, 'disconnect');
			}
			delete this.connection;
		} catch (e) {
			console.log(e);
		}
	}
	_connect() {
		return new Promise((resolve) => {
			this._close();
			clearInterval(this.reconnect_timeout);
			this.reconnect_timeout = setInterval(() => (!this.connection || this.connection.readyState) > 1 && this.reconnect(), 5000);
			this.connection = new WebSocket(`${ this.url }/websocket`);

			this.connection.onopen = () => {
				this.emit('open');
				resolve();
				this.ddp.emit('open');
				// this._login && this.login(this._login);
				if (this._login) {
					this.login(this._login);
				}
				this.connection.onclose = e => this.emit('disconnected', e);
			};
			this.connection.onmessage = (e) => {
				const data = EJSON.parse(e.data);
				this.emit(data.msg, data);
				return data.collection && this.emit(data.collection, data);
			};
		}).catch(alert);
	}
	logout() {
		this._login = null;
		return this.call('logout').then(() => this.subscriptions = {});
	}
	disconnect() {
		this._close();
	}
	async reconnect() {
		this.disconnect();
		await this._connect();
		this.once('logged', () => {
			Object.keys(this.subscriptions).forEach((key) => {
				const { name, params } = this.subscriptions[key];
				this.subscriptions[key].unsubscribe();
				this.subscribe(name, params);
			});
		});
	}
	call(method, ...params) {
		return this.send({
			msg: 'method', method, params
		}).then(data => data.result || data.subs).catch((err) => {
			Answers.logCustom('DDP call Error', err);
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
			Answers.logCustom('DDP unsubscribe Error', err);
			return Promise.reject(err);
		});
	}
	subscribe(name, ...params) {
		return this.send({
			msg: 'sub', name, params
		}).then(({ id }) => {
			const args = {
				name,
				params,
				unsubscribe: () => this.unsubscribe(id)
			};
			this.subscriptions[id] = args;
			return args;
		}).catch((err) => {
			Answers.logCustom('DDP subscribe Error', err);
			return Promise.reject(err);
		});
	}
}
