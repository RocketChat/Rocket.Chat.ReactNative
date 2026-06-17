import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { tsToMs } from '../../../lib/dayjs';
import { type TAnyMessageModel } from '../../../definitions';

/**
 * Upper ts bound (ms) for a Jump to Message onto a target that is cached locally but sits OUTSIDE the
 * current bounded Message Window.
 *
 * Returns the ts of the nearest Newer Loader (t === NEXT_CHUNK) sitting ABOVE the target in the local
 * cache — the upper bracket of the target's Chunk (a gappy island left by a prior jump). Anchoring
 * there re-seeds the window onto a bounded page that still exposes a "Load newer" affordance and can
 * auto-rejoin the Live Tail.
 *
 * Returns null when no Newer Loader sits above the target (the cached region is contiguous toward the
 * Live Tail); the caller then falls back to the target's own ts so the window still re-seeds onto it.
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
