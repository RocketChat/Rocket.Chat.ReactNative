import database from '../../database';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import { type ILastMessage, type IMessage, type TSubscriptionModel } from '../../../definitions';
import log from './log';

const maxUpdatedAt = (messages: (IMessage | ILastMessage)[]): number => {
	let max = 0;
	messages.forEach(message => {
		if (!message._updatedAt) {
			return;
		}
		const updatedAt = new Date(message._updatedAt).getTime();
		if (updatedAt > max) {
			max = updatedAt;
		}
	});
	return max;
};

// lastOpen doubles as the chat.syncMessages cursor. Advance it only from server
// message timestamps, never past an empty batch, so a client clock ahead of the
// server can't skip messages (issue #7499).
export const advanceSyncCursor = async (rid: string, messages: (IMessage | ILastMessage)[]): Promise<void> => {
	try {
		const latest = maxUpdatedAt(messages);
		if (!latest) {
			return;
		}
		const subscription = await getSubscriptionByRoomId(rid);
		if (!subscription) {
			return;
		}
		const current = subscription.lastOpen ? new Date(subscription.lastOpen).getTime() : 0;
		if (latest <= current) {
			return;
		}
		const db = database.active;
		await db.write(async () => {
			await subscription.update((s: TSubscriptionModel) => {
				s.lastOpen = new Date(latest);
			});
		});
	} catch (e) {
		log(e);
	}
};
