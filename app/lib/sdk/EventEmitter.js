export default class EventEmitter {
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
		return listener;
	}
}
