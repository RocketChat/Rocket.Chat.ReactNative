import { ICredentials } from '../../../definitions';
import { IEmitUserInteraction } from '../../../containers/UIKit/interfaces';
import log from './log';

type TEventEmitterEmmitArgs =
	| { rid: string }
	| { server: string }
	| { message: string }
	| { method: string }
	| { invalid: boolean }
	| { force: boolean }
	| { hasBiometry: boolean }
	| { visible: boolean; onCancel?: null | Function }
	| { cancel: () => void }
	| { submit: (param: string) => void }
	| { params: ICredentials }
	| IEmitUserInteraction;

class EventEmitter {
	private events: { [key: string]: any };

	constructor() {
		this.events = {};
	}

	addEventListener(event: string, listener: Function) {
		if (typeof this.events[event] !== 'object') {
			this.events[event] = [];
		}
		this.events[event].push(listener);
		return listener;
	}

	removeListener(event: string, listener: Function) {
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

	/**
	 * @deprecated use lib/methods/helpers/emitter.ts
	 */
	emit(event: string, ...args: TEventEmitterEmmitArgs[]) {
		if (typeof this.events[event] === 'object') {
			this.events[event].forEach((listener: Function) => {
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
