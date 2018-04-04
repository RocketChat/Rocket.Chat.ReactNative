import getRooms from './getRooms';
import EventEmitter from './EventEmitter';

export const STATUS = {
	CONNECTING:	0,
	OPEN:	1,
	CLOSING:	2,
	CLOSED:	3,
	LOGGED: 4
};


export default class extends EventEmitter {
	constructor({ token, userId, server }) {
		super();
		this.server = server;
		this.status = STATUS.CLOSED;
	}
	connect() {
		this.ddp = new Dpp(this.server);
	}
	getRooms
}
