import { Q } from '../../../lib/database/facade';
import database from '../../../lib/database';
import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { tsToMs } from '../../../lib/dayjs';
import { type TAnyMessageModel } from '../../../definitions';

/**
 * ts of the nearest Newer Loader above the target = the upper bracket of its Chunk; null when the
 * cached region runs contiguous to the Live Tail (caller falls back to the target's own ts).
 */
const getLocalAnchorTs = async (rid: string, targetTs: Date | number | string): Promise<number | null> => {
	const targetMs = tsToMs(targetTs);
	const loaders = (await database.active
		.get('messages')
		.query(
			Q.where('rid', rid),
			Q.where('t', MessageTypeLoad.NEXT_CHUNK),
			Q.where('ts', Q.gt(targetMs)),
			Q.sortBy('ts', Q.asc),
			Q.take(1)
		)
		.fetch()) as TAnyMessageModel[];

	return loaders.length ? tsToMs(loaders[0].ts) : null;
};

export default getLocalAnchorTs;
