import log from '../../../lib/methods/helpers/log';
import database from '../../../lib/database';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { getThreadById } from '../../../lib/database/services/Thread';

export const loadDraftMessage = async ({ rid, tmid }: { rid: string; tmid?: string }): Promise<string> => {
	if (tmid) {
		const thread = await getThreadById(tmid);
		if (thread && thread.draftMessage) {
			return thread.draftMessage;
		}
	}
	const room = await getSubscriptionByRoomId(rid);
	if (room && room.draftMessage) {
		return room.draftMessage;
	}

	return '';
};

export const saveDraftMessage = async ({
	rid,
	tmid,
	draftMessage
}: {
	rid: string;
	tmid?: string;
	draftMessage: string;
}): Promise<void> => {
	let obj;
	if (tmid) {
		obj = await getThreadById(tmid);
	} else {
		obj = await getSubscriptionByRoomId(rid);
	}
	if (obj) {
		try {
			const db = database.active;
			const object = obj;
			await db.write(async () => {
				await object.update(r => {
					r.draftMessage = draftMessage;
				});
			});
		} catch (e) {
			log(e);
		}
	}
};
