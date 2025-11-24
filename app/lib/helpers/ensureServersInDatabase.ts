import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { TOKEN_KEY } from '../constants/keys';
import database from '../database';
import userPreferences from '../methods/userPreferences';

const ensureServersInDatabase = async (): Promise<void> => {
	const prefix = `${TOKEN_KEY}-`;
	const keys = userPreferences.getAllKeys();
	const serverUrls = Array.from(
		new Set(
			keys
				.filter(key => key.startsWith(prefix))
				.map(key => key.slice(prefix.length))
				.filter(serverKey => serverKey.startsWith('http://') || serverKey.startsWith('https://'))
		)
	);

	if (serverUrls.length === 0) {
		return;
	}

	const serversDB = database.servers;
	const serverCollection = serversDB.get('servers');
	const existingRecords = await serverCollection.query().fetch();
	const existingIds = new Set(existingRecords.map(record => record.id));

	const missingServers = serverUrls.filter(url => !existingIds.has(url));
	if (!missingServers.length) {
		return;
	}

	try {
		await serversDB.write(async () => {
			await Promise.all(
				missingServers.map(url =>
					serverCollection.create(record => {
						record._raw = sanitizedRaw({ id: url }, serverCollection.schema);
						record.name = url;
					})
				)
			);
		});
		userPreferences.setBool('WORKSPACE_MIGRATION_COMPLETED', true);
	} catch (error) {
		console.error('Failed to ensure servers in database:', error);
		throw error;
	}
};

export default ensureServersInDatabase;
