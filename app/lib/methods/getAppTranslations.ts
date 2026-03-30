import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import database from '../database';
import log from './helpers/log';
import protectedFunction from './helpers/protectedFunction';
import sdk from '../services/sdk';

async function fetchAndSaveTranslations(language: string, db: any): Promise<void> {
	const result = await sdk.get('apps.translations', { language });

	if (!result?.success || !result.translations) {
		return;
	}

	await db.write(async () => {
		const collection = db.get('app_translations');

		const existing = await collection.query(Q.where('language', result.language)).fetch();
		const toDelete = existing.map((r: any) => r.prepareDestroyPermanently());

		const toCreate = Object.entries(result.translations).map(([key, value]) =>
			collection.prepareCreate(
				protectedFunction((r: any) => {
					r._raw = sanitizedRaw({ id: `${result.language}_${key}` }, collection.schema);
					r.key = key;
					r.value = value as string;
					r.language = result.language;
				})
			)
		);

		await db.batch(...toDelete, ...toCreate);
	});
}

export async function getAppTranslations(language = 'en'): Promise<void> {
	try {
		const db = database.active;
		const collection = db.get('app_translations');

		// check if translations already exist in DB for this language
		const existing = await collection.query(Q.where('language', language)).fetchCount();

		if (existing > 0) {
			// already have translations — skip fetch
			return;
		}

		// nothing in DB — fetch from server and save
		await fetchAndSaveTranslations(language, db);
	} catch (e) {
		log(e);
	}
}
