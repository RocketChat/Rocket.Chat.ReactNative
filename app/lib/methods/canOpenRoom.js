import database from '../database';

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
	try {
		const db = database.active;
		const subsCollection = db.collections.get('subscriptions');
		const [type] = path.split('/');
		if (type === 'channel') {
			return true;
		}

		try {
			await subsCollection.find(rid);
			return true;
		} catch (error) {
			// Do nothing
		}

		try {
			return await open.call(this, { type, rid });
		} catch (e) {
			return false;
		}
	} catch (e) {
		return false;
	}
}
