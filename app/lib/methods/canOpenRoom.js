import * as SDK from '@rocket.chat/sdk';

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
		await SDK.api.post(`${ restTypes[type] }.open`, { roomId: rid });
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
		await SDK.driver.asyncCall('getRoomByTypeAndName', ddpTypes[type], name);
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
		const data = await (SDK.driver.ddp ? canOpenRoomDDP.call(this, { rid, type, name }) : canOpenRoomREST.call(this, { type, rid }));
		return data;
	} catch (e) {
		log('canOpenRoom', e);
		return false;
	}
}
