import database from '../database';
import log from './helpers/log';
import { Q } from '@nozbe/watermelondb';

export async function deletePrivateMessages(id?: string): Promise<void> {
	try {
		const db = database.active;
        
        const messages = id ? await db.get('messages').query(Q.where('id', id)).fetch() : await db.get('messages').query(Q.where('private', true)).fetch();
        const messagesToBeDeleted = messages.map((message) => message.prepareDestroyPermanently());

		await db.write(async () => {
			try {
                await db.batch(...messagesToBeDeleted);
			} catch (e) {
                console.log('e', e);
				// Do nothing
			}
		});
	} catch (e) {
		log(e);
	}
}
