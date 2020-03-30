import log from '../../utils/log';
import updateMessages from './updateMessages';

async function load({ rid: roomId, latest, t }) {
	let params = { roomId, count: 50 };
	if (latest) {
		params = { ...params, latest: new Date(latest).toISOString() };
	}
	// RC 0.48.0
	const data = await this.sdk.get(`${ this.roomTypeToApiType(t) }.history`, params);
	if (!data || data.status === 'error') {
		return [];
	}
	return data.messages;
}

export default function loadMessagesForRoom(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = await load.call(this, args);

			if (data && data.length) {
				await updateMessages({ rid: args.rid, update: data });
				return resolve(data);
			} else {
				return resolve([]);
			}
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
