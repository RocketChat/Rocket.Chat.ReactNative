import database from '../realm';

const restTypes = {
	channel: 'channels', direct: 'im', group: 'groups'
};

async function open({ type, rid }) {
	try {
		// RC 0.61.0
		await this.sdk.post(`${ restTypes[type] }.open`, { roomId: rid });
		return true;
	} catch (e) {
		if (e.data && /is already open/.test(e.data.error)) {
			return true;
		}
		return false;
	}
}

export default async function canOpenRoom({ rid, path }) {
	const [type] = path.split('/');
	if (type === 'channel') {
		return true;
	}

	const room = database.objects('subscriptions').filtered('rid == $0', rid);
	if (room.length) {
		return true;
	}

	try {
		return await open.call(this, { type, rid });
	} catch (e) {
		return false;
	}
}
