import { ERoomTypes } from '../../definitions';
import database from '../database';
import sdk from '../services/sdk';
import { Services } from '../services';

const restTypes = {
	channel: 'channels',
	direct: 'im',
	group: 'groups'
};

async function open({ type, rid, name }: { type: ERoomTypes; rid: string; name: string }) {
	try {
		const params = rid ? { roomId: rid } : { roomName: name };

		// if it's a direct link without rid we'll create a new dm
		// if the dm already exists it'll return the existent
		if (type === ERoomTypes.DIRECT && !rid) {
			const result = await Services.createDirectMessage(name);
			if (result.success) {
				const { room } = result;
				return {
					...room,
					rid: room._id
				};
			}
		}

		// if it's a group we need to check if you can open
		if (type === ERoomTypes.GROUP) {
			try {
				// RC 0.61.0
				// @ts-ignore
				await sdk.post(`${restTypes[type]}.open`, params);
			} catch (e: any) {
				if (!(e.data && /is already open/.test(e.data.error))) {
					return false;
				}
			}
		}

		// if it's a channel or group and the link don't have rid
		// we'll get info from the room
		if ((type === ERoomTypes.CHANNEL || type === ERoomTypes.GROUP) && !rid) {
			// RC 0.72.0
			// @ts-ignore
			const result: any = await sdk.get(`${restTypes[type]}.info`, params);
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

export async function canOpenRoom({ rid, path }: { rid: string; path: string }): Promise<any> {
	try {
		const db = database.active;
		const subsCollection = db.get('subscriptions');

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
		const t = type as ERoomTypes;
		try {
			const result = await open({ type: t, rid, name });
			return result;
		} catch (e) {
			return false;
		}
	} catch (e) {
		return false;
	}
}
