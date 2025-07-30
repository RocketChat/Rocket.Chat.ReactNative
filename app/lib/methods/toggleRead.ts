import database from '../database';
import { compareServerVersion } from './helpers/compareServerVersion';
import log, { events, logEvent } from './helpers/log';
import { Services } from '../services';

export const toggleRead = async (rid: string, tIsRead: boolean, serverVersion: string) => {
	logEvent(tIsRead ? events.RL_UNREAD_CHANNEL : events.RL_READ_CHANNEL);
	try {
		const db = database.active;
		const includeThreads = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.4.0');
		const result = await Services.toggleReadStatus(tIsRead, rid, includeThreads);

		if (result.success) {
			const subCollection = db.get('subscriptions');
			await db.write(async () => {
				try {
					const subRecord = await subCollection.find(rid);
					await subRecord.update(sub => {
						sub.alert = tIsRead;
						sub.unread = 0;
						if (includeThreads) {
							sub.tunread = [];
						}
					});
				} catch (e) {
					log(e);
				}
			});
		}
	} catch (e) {
		log(e);
	}
};
