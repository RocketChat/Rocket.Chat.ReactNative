import database from '../database';

export async function clearCache({ server }: { server: string }): Promise<void> {
	try {
		const serversDB = database.servers;
		await serversDB.write(async () => {
			const serverCollection = serversDB.get('servers');
			const serverRecord = await serverCollection.find(server);
			await serverRecord.update(s => {
				s.roomsUpdatedAt = null;
			});
		});
	} catch (e) {
		// Do nothing
	}

	try {
		const db = database.active;
		await db.write(() => db.unsafeResetDatabase());
	} catch (e) {
		// Do nothing
	}
}
