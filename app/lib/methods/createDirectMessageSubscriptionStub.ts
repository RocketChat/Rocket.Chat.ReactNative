import database from '../database';
import { SUBSCRIPTIONS_TABLE } from '../database/model/Subscription';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { SubscriptionType } from '../../definitions';
import { store as reduxStore } from '../store/auxStore';
import log from './helpers/log';

interface ICreateDirectMessageSubscriptionStubArgs {
	rid: string;
	username: string;
	fname?: string;
}

/**
 * Inserts a minimal Subscription row for a freshly created direct message so that
 * `useSubscription(rid)` consumers (e.g. NewMediaCall peer prefill) see a non-null
 * record between REST `im.create` returning and realtime sync delivering the full
 * subscription doc.
 *
 * Idempotent: skips when a row already exists for `rid`. The realtime upsert in
 * `createOrUpdateSubscription` performs `getSubscriptionByRoomId` first and runs
 * `prepareUpdate` when found, so the full doc merges into this stub without
 * duplicate-row risk.
 *
 * Never throws — navigation must proceed even if the stub write fails.
 */
export const createDirectMessageSubscriptionStub = async ({
	rid,
	username,
	fname
}: ICreateDirectMessageSubscriptionStubArgs): Promise<void> => {
	try {
		if (!rid || !username) {
			return;
		}

		const existing = await getSubscriptionByRoomId(rid);
		if (existing) {
			return;
		}

		const loginUser = reduxStore?.getState?.()?.login?.user;
		const currentUserId = loginUser?.id;
		const currentUsername = loginUser?.username;
		if (!currentUserId || !currentUsername) {
			return;
		}

		const otherUserId = rid.replace(currentUserId, '').trim();

		const db = database.active;
		const subCollection = db.get(SUBSCRIPTIONS_TABLE);
		const now = new Date();

		await db.write(async () => {
			await subCollection.create((s: any) => {
				s._raw.id = rid;
				s._raw._id = rid;
				s.rid = rid;
				s.t = SubscriptionType.DIRECT;
				s.name = username;
				s.fname = fname || username;
				s.uids = otherUserId ? [currentUserId, otherUserId] : [currentUserId];
				s.usernames = [currentUsername, username];
				s.open = true;
				s.alert = false;
				s.unread = 0;
				s.userMentions = 0;
				s.groupMentions = 0;
				s.ro = false;
				s.archived = false;
				s.f = false;
				s.ts = now;
				s.ls = now;
				s.roomUpdatedAt = now;
			});
		});
	} catch (e) {
		log(e);
	}
};
