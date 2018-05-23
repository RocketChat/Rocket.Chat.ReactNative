import { post } from './helpers/rest';
import database from '../realm';
import log from '../../utils/log';

// TODO: api fix
const ddpTypes = {
	channel: 'c', direct: 'd', group: 'p'
};
const restTypes = {
	channel: 'channels', direct: 'im', group: 'groups'
};

async function canOpenRoomREST({ type, rid }) {
	try {
		const { token, id } = this.ddp._login;
		const server = this.ddp.url.replace('ws', 'http');
		await post({ token, id, server }, `${ restTypes[type] }.open`, { roomId: rid });
		return true;
	} catch (error) {
		// TODO: workround for 'already open for the sender' error
		if (!error.errorType) {
			return true;
		}
		return false;
	}
}

async function canOpenRoomDDP(...args) {
	try {
		const [{ type, name }] = args;
		await this.ddp.call('getRoomByTypeAndName', ddpTypes[type], name);
		return true;
	} catch (error) {
		if (error.isClientSafe) {
			return false;
		}
		return canOpenRoomREST.call(this, ...args);
	}
}

export default async function canOpenRoom({ rid, path }) {
	const { database: db } = database;

	const room = db.objects('subscriptions').filtered('rid == $0', rid);
	if (room.length) {
		return true;
	}

	const [type, name] = path.split('/');

	try {
		// eslint-disable-next-line
		const data = await (this.ddp && this.ddp.status ? canOpenRoomDDP.call(this, { rid, type, name }) : canOpenRoomREST.call(this, { type, rid }));
		return data;
	} catch (e) {
		log('canOpenRoom', e);
	}
}
