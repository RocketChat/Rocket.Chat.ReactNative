import { Q } from '@nozbe/watermelondb';

import { ERoomTypes } from '../../definitions';
import database from '../database';
import sdk from '../services/sdk';
import { createDirectMessage } from './createDirectMessage';
import { getRoomByTypeAndName } from '../services/restApi';

async function openGroup(roomId: string) {
	try {
		// RC 0.61.0
		await sdk.post('groups.open', { roomId });
		return true;
	} catch (e: any) {
		return !!(e.data && /is already open/.test(e.data.error));
	}
}

async function open({ type, rid, name }: { type: ERoomTypes; rid: string; name: string }) {
	try {
		// if it's a direct link without rid we'll create a new dm
		// if the dm already exists it'll return the existent
		if (type === ERoomTypes.DIRECT && !rid) {
			const result = await createDirectMessage(name);
			if (result.success) {
				const { room } = result;
				return {
					...room,
					rid: room._id
				};
			}
		}

		if (type === ERoomTypes.CHANNEL || type === ERoomTypes.GROUP) {
			let roomId = rid;
			let room = null;

			// The path segment of a deep link may hold either a room name or a room id.
			// getRoomByTypeAndName resolves both, unlike the REST endpoints, which match
			// roomName exactly and return "not found" when handed an id.
			if (!roomId) {
				const roomType = type === ERoomTypes.GROUP ? 'p' : 'c';
				room = await getRoomByTypeAndName(roomType, name);
				roomId = room?._id;
			}

			if (!roomId) {
				return false;
			}

			// a group has to be open before it can be read
			if (type === ERoomTypes.GROUP) {
				const didOpenGroup = await openGroup(roomId);
				if (!didOpenGroup) {
					return false;
				}
			}

			if (room) {
				return {
					...room,
					rid: roomId
				};
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

function formatRoom(room: any, rid?: string) {
	return (
		room?.asPlain?.() ?? {
			rid: rid ?? room.rid,
			t: room.t,
			name: room.name,
			fname: room.fname,
			prid: room.prid,
			uids: room.uids,
			usernames: room.usernames
		}
	);
}

async function findSubscriptionByRid(subsCollection: any, rid: string) {
	try {
		const room = await subsCollection.find(rid);
		return formatRoom(room, rid);
	} catch {
		return null;
	}
}

async function findSubscriptionByName(subsCollection: any, name: string, roomType: string) {
	try {
		const rows = await subsCollection
			.query(Q.or(Q.where('name', name), Q.where('rid', name)), Q.where('t', roomType), Q.take(1))
			.fetch();
		if (rows.length && rows[0]) {
			return formatRoom(rows[0]);
		}
	} catch {
		// Do nothing
	}
	return null;
}

export async function canOpenRoom({ rid, path }: { rid: string; path: string }): Promise<any> {
	try {
		const db = database.active;
		const subsCollection = db?.get ? db.get('subscriptions') : null;

		if (subsCollection && rid) {
			const room = await findSubscriptionByRid(subsCollection, rid);
			if (room) {
				return room;
			}
		}

		if (path) {
			const [type, name] = path.split('/');
			const t = type as ERoomTypes;
			const roomType = t === ERoomTypes.GROUP ? 'p' : t === ERoomTypes.DIRECT ? 'd' : (t as string) === 'channels' ? 'l' : 'c';

			if (subsCollection && name) {
				const room = await findSubscriptionByName(subsCollection, name, roomType);
				if (room) {
					return room;
				}
			}

			try {
				const result = await open({ type: t, rid, name });
				return result;
			} catch (e) {
				return false;
			}
		}

		return false;
	} catch (e) {
		return false;
	}
}
