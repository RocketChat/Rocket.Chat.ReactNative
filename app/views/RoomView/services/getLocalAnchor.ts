import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { tsToMs } from '../../../lib/dayjs';
import { type TAnyMessageModel } from '../../../definitions';

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

const getLocalAnchorTs = async (rid: string, targetTs: Date | number | string): Promise<number | null> => {
	const loader = await findNewerLoaderAbove(rid, targetTs, 'nearest');

	return loader ? tsToMs(loader.ts) : null;
};

export default getLocalAnchorTs;
