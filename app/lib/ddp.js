import EJSON from 'ejson';

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
	constructor(url) {
		super();
		this.url = url.replace(/^http/, 'ws');
		this.id = 0;
		this.subscriptions = {};
		this._connect();
		this.ddp = new EventEmitter();
		this.on('ping', () => this.send({ msg: 'pong' }));
		this.on('result', data => this.ddp.emit(data.id, { id: data.id, result: data.result, error: data.error }));
		this.on('ready', data => this.ddp.emit(data.subs[0], data));
	}
	send(obj) {
		return new Promise((resolve, reject) => {
			this.id += 1;
			const id = obj.id || `${ this.id }`;
			this.connection.send(EJSON.stringify({ ...obj, id }));
			this.ddp.once(id, data => (data.error ? reject(data.error) : resolve({ id, ...data })));
		});
	}
	_connect() {
		const connection = new WebSocket(`${ this.url }/websocket`);
		connection.onopen = () => {
			this.emit('open');
			this.send({ msg: 'connect', version: '1', support: ['1', 'pre2', 'pre1'] });
		};
		connection.onclose = e => this.emit('disconnected', e);
		// connection.onerror = () => {
		// 	// alert(error.type);
		// 	// console.log(error);
		// 	// console.log(`WebSocket Error ${ JSON.stringify({...error}) }`);
		// };

		connection.onmessage = (e) => {
			const data = EJSON.parse(e.data);
			this.emit(data.msg, data);
			return data.collection && this.emit(data.collection, data);
		};
		// this.on('disconnected', e => alert(JSON.stringify(e)));
		this.connection = connection;
	}
	logout() {
		return this.call('logout').then(() => this.subscriptions = {});
	}
	disconnect() {
		this.emit('disconnected_by_user');
		this.connection.close();
	}
	reconnect() {
		this.disconnect();
		this.once('connected', () => {
			Object.keys(this.subscriptions).forEach((key) => {
				const { name, params } = this.subscriptions[key];
				this.subscriptions[key].unsubscribe();
				this.subscribe(name, params);
			});
		});
		this._connect();
	}
	call(method, ...params) {
		return this.send({
			msg: 'method', method, params
		}).then(data => data.result || data.subs);
	}
	unsubscribe(id) {
		if (!this.subscriptions[id]) {
			return Promise.reject(id);
		}
		delete this.subscriptions[id];
		return this.send({
			msg: 'unsub',
			id
		}).then(data => data.result || data.subs);
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
		});
	}
}
