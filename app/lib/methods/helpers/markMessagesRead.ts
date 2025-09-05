import { Q } from '@nozbe/watermelondb';

import database from '../../database';

interface IMarkMessagesReadParams {
	rid: string;
	lastOpen: number;
}

const markMessagesRead = async ({ rid, lastOpen }: IMarkMessagesReadParams) => {
	const db = database.active;
	try {
		const messages = await db
			.get('messages')
			.query([Q.where('rid', rid), Q.where('unread', true), Q.where('ts', Q.lte(lastOpen))])
			.fetch();
		await db.write(async () => {
			await db.batch(
				...messages.map(message =>
					message.prepareUpdate(m => {
						m.unread = false;
					})
				)
			);
		});
	} catch (e) {
		// do nothing
	}
};

export default markMessagesRead;
