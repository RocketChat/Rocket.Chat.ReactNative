import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { tsToMs } from '../../../lib/dayjs';
import { type TAnyMessageModel } from '../../../definitions';

/**
 * The single Newer Loader above `aboveTs`: `nearest` = lowest ts (the upper bracket of the target's
 * Chunk), `closestToLiveTail` = highest ts (the boundary loader the rejoin climbs toward).
 */
export const findNewerLoaderAbove = async (
	rid: string,
	aboveTs: Date | number | string,
	direction: 'nearest' | 'closestToLiveTail'
): Promise<TAnyMessageModel | null> => {
	const rows = (await database.active
		.get('messages')
		.query(
			Q.where('rid', rid),
			Q.where('t', MessageTypeLoad.NEXT_CHUNK),
			Q.where('ts', Q.gt(tsToMs(aboveTs))),
			Q.sortBy('ts', direction === 'nearest' ? Q.asc : Q.desc),
			Q.take(1)
		)
		.fetch()) as TAnyMessageModel[];

	return rows[0] ?? null;
};

/**
 * ts of the nearest Newer Loader above the target = the upper bracket of its Chunk; null when the
 * cached region runs contiguous to the Live Tail (caller falls back to the target's own ts).
 */
const getLocalAnchorTs = async (rid: string, targetTs: Date | number | string): Promise<number | null> => {
	const loader = await findNewerLoaderAbove(rid, targetTs, 'nearest');

	return loader ? tsToMs(loader.ts) : null;
};

export default getLocalAnchorTs;
