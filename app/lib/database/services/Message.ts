import { Q } from '@nozbe/watermelondb';

import database from '..';
import { type TMessageModel } from '../../../definitions';
import { MESSAGE_TYPE_ANY_LOAD, type MessageTypeLoad } from '../../constants/messageTypeLoad';
import { messagesStatus } from '../../constants/messagesStatus';
import log from '../../methods/helpers/log';
import { type TAppDatabase } from '../interfaces';
import { MESSAGES_TABLE } from '../model/Message';

const getCollection = (db: TAppDatabase) => db.get(MESSAGES_TABLE);

// Head of the room scanned for a server-stamped row. Device-stamped rows cluster at the head (one
// load-more sentinel per loaded window, plus the unsent queue), and the `rid` index keeps the read
// cheap, so this is sized well past the handful expected rather than at the minimum.
const NEWEST_MESSAGE_SCAN = 20;

// Synthetic load-more sentinels and unsent TEMP/ERROR rows are stamped with the device clock, so
// they are skipped: taking one as a sync cursor would ask the server for changes newer than a
// clock that may run ahead. They are discriminated in JS rather than by a query predicate because
// `t` and `status` are both nullable for ordinary messages, and adapter null semantics for
// `Q.notIn` differ between LokiJS and SQLite.
const isServerStamped = (message: TMessageModel) =>
	!MESSAGE_TYPE_ANY_LOAD.includes(message.t as MessageTypeLoad) &&
	(message.status ?? messagesStatus.SENT) === messagesStatus.SENT;

/**
 * Newest server stamp this device holds for a room — the point it is provably in sync with.
 * Returns null when the whole head of the room is device-stamped, leaving the caller to fall
 * back; the window scanned is sized so that only a large unsent backlog can exhaust it.
 */
export const getNewestMessageUpdatedAt = async (rid: string): Promise<Date | null> => {
	const db = database.active;
	const messageCollection = getCollection(db);
	try {
		const rows = (await messageCollection
			.query(Q.where('rid', rid), Q.sortBy('_updated_at', Q.desc), Q.take(NEWEST_MESSAGE_SCAN))
			.fetch()) as TMessageModel[];
		const newest = rows.find(isServerStamped)?._updatedAt;
		return newest ? new Date(newest) : null;
	} catch (e) {
		log(e);
		return null;
	}
};

export const getMessageById = async (messageId: string | null) => {
	if (!messageId) {
		return null;
	}
	const db = database.active;
	const messageCollection = getCollection(db);
	try {
		const result = await messageCollection.find(messageId);
		return result;
	} catch {
		return null;
	}
};
