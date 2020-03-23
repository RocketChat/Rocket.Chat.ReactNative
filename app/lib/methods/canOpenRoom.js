import database from '../database';

const restTypes = {
	channel: 'channels', direct: 'im', group: 'groups'
};

async function open({ type, rid, name }) {
	try {
		const params = rid ? { roomId: rid } : { roomName: name };

		// RC 0.61.0
		await this.sdk.post(`${ restTypes[type] }.open`, params);

		if (!rid) {
			// RC 0.72.0
			const result = await this.sdk.get(`${ restTypes[type] }.info`, params);
			rid = result[type]._id;
			return { rid, ...result[type] };
		}

		return { rid };
	} catch (e) {
		if (e.data && /is already open/.test(e.data.error)) {
			return { rid };
		}
		return false;
	}
}

export default async function canOpenRoom({ rid, path }) {
	try {
		const db = database.active;
		const subsCollection = db.collections.get('subscriptions');
		const [type, name] = path.split('/');
		if (type === 'channel') {
			return { rid };
		}

		try {
			await subsCollection.find(rid);
			return { rid };
		} catch (error) {
			// Do nothing
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
