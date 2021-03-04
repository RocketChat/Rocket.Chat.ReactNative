import database from '../database';
import store from '../createStore';

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

export default async function canOpenRoom({ rid, path, isCall }) {
	try {
		const db = database.active;
		const subsCollection = db.get('subscriptions');

		if (isCall && !rid) {
			// Extract rid from a Jitsi URL
			// Eg.: [Jitsi_URL_Room_Prefix][uniqueID][rid][?jwt]
			const { Jitsi_URL_Room_Prefix, uniqueID } = store.getState().settings;
			rid = path.replace(`${ Jitsi_URL_Room_Prefix }${ uniqueID }`, '').replace(/\?(.*)/g, '');
		}

		if (rid) {
			try {
				const room = await subsCollection.find(rid);
				return {
					rid,
					t: room.t,
					name: room.name,
					fname: room.fname,
					prid: room.prid,
					uids: room.uids,
					usernames: room.usernames
				};
			} catch (e) {
				// Do nothing
			}
		}

		const [type, name] = path.split('/');
		try {
			const result = await open.call(this, { type, rid, name });
			return result;
		} catch (e) {
			return false;
		}
	} catch (e) {
		return false;
	}
}
