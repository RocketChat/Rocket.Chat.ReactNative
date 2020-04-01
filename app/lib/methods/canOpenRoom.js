import database from '../database';

const restTypes = {
	channel: 'channels', direct: 'im', group: 'groups'
};

async function open({ type, rid, name }) {
	try {
		const params = rid ? { roomId: rid } : { roomName: name };

		// if it's a direct link without rid we'll create a new dm
		// if the dm already exists it'll return the existent
		if (type === 'direct' && !rid) {
			const result = await this.createDirectMessage(name);
			if (result.success) {
				const { room } = result;
				room.rid = room._id;
				return room;
			}
		}

		// if it's a group we need to check if you can open
		if (type === 'group') {
			try {
				// RC 0.61.0
				await this.sdk.post(`${ restTypes[type] }.open`, params);
			} catch (e) {
				if (!(e.data && /is already open/.test(e.data.error))) {
					return false;
				}
			}
		}

		// if it's a channel or group and the link don't have rid
		// we'll get info from the room
		if ((type === 'channel' || type === 'group') && !rid) {
			// RC 0.72.0
			const result = await this.sdk.get(`${ restTypes[type] }.info`, params);
			if (result.success) {
				const room = result[type];
				room.rid = room._id;
				return room;
			}
		}

		// if rid was sent by link
		if (rid) {
			return { rid };
		}
		return false;
	} catch (e) {
		return false;
	}
}

export default async function canOpenRoom({ rid, path }) {
	try {
		const db = database.active;
		const subsCollection = db.collections.get('subscriptions');
		const [type, name] = path.split('/');

		if (rid) {
			try {
				await subsCollection.find(rid);
				return { rid };
			} catch (e) {
				// Do nothing
			}
		}

		try {
			return await open.call(this, { type, rid, name });
		} catch (e) {
			return false;
		}
	} catch (e) {
		return false;
	}
}
