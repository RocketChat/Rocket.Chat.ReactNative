import Model from '@nozbe/watermelondb/Model';

import database from '../../database';
import { IServer } from '../../../definitions';

export default async function clearCache({ server }: { server: string }): Promise<void> {
	try {
		const serversDB = database.servers;
		// @ts-ignore
		await serversDB.action(async () => {
			const serverCollection = serversDB.get('servers');
			const serverRecord = await serverCollection.find(server);
			(await serverRecord.update(s => {
				// @ts-ignore
				s.roomsUpdatedAt = null;
			})) as IServer & Model;
		});
	} catch (e) {
		// Do nothing
	}

	try {
		const db = database.active;
		await db.action(() => db.unsafeResetDatabase());
	} catch (e) {
		// Do nothing
	}
}
