import { Image } from 'expo-image';
import { type Dispatch } from 'redux';

import { appStart } from '~/actions/app';
import { selectServerRequest } from '~/actions/server';
import { RootEnum } from '~/definitions';
import I18n from '~/i18n';
import database from '../database';
import { disconnect } from '../services/connect';
import { deleteMediaFiles } from './handleMediaDownload';

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

export async function clearCacheAndReconnect({
	server,
	version,
	dispatch
}: {
	server: string;
	version: string;
	dispatch: Dispatch;
}): Promise<void> {
	dispatch(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Clear_cache_loading') }));
	await deleteMediaFiles(server);
	await clearCache({ server });
	await Image.clearMemoryCache();
	await Image.clearDiskCache();
	disconnect();
	dispatch(selectServerRequest(server, version, true));
}
