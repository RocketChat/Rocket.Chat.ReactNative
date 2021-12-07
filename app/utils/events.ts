import log from './log';

class EventEmitter {
	private events: { [key: string]: any };
	constructor() {
		this.events = {};
	}

	addEventListener(event: string, listener: any) {
		if (typeof this.events[event] !== 'object') {
			this.events[event] = [];
		}
		this.events[event].push(listener);
		return listener;
	}

	removeListener(event: string, listener: any) {
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

	emit(event: string, ...args: any[]) {
		if (typeof this.events[event] === 'object') {
			this.events[event].forEach((listener: any) => {
				try {
					listener.apply(this, args);
				} catch (e) {
					log(e);
				}
			});
		}
	}
}

const events = new EventEmitter();
export default events;
