import { type IMessage } from '../../../definitions';
import { tsToMs } from '../../../lib/methods/helpers/tsToMs';
import { anchorForServerChunk, type AnchorMessage } from '../List/hooks/anchorResolver';

export interface IJumpTarget {
	id: string;
	tmid?: string;
	ts: Date | number | string;
	fromServer?: boolean;
}

export interface IJumpAnchorDeps {
	loadSurroundingMessages: (params: { messageId: string; rid: string }) => Promise<unknown>;
	getLocalAnchorTs: (rid: string, ts: Date | number | string) => Promise<number | null>;
}

/**
 * Decide the upper ts bound (ms) for a Jump to Message, or null to keep a Live Window.
 *
 * Returns null — stay on the Live Tail, no anchoring, no I/O — when the target is a thread message,
 * the room id is missing, or the target is already in the rendered window (a nearby quoted reply
 * scrolls in place). Otherwise re-seeds onto the target's Chunk:
 *  - fromServer: fetch one Chunk so a Newer Loader can bracket the target; a Chunk that reaches the
 *    Live Tail resolves to null and stays live.
 *  - cached but out of window: reuse the Newer Loader already bracketing the target's Chunk; with no
 *    bracketing Loader (contiguous cached region) anchor at the target's own ts so it still re-seeds.
 */
export const resolveJumpAnchor = async (
	rid: string | undefined,
	target: IJumpTarget,
	inWindow: boolean,
	deps: IJumpAnchorDeps
): Promise<number | null> => {
	if (target.tmid || !rid || inWindow) {
		return null;
	}

	if (target.fromServer) {
		const chunk = (await deps.loadSurroundingMessages({ messageId: target.id, rid })) as IMessage[];
		const anchorMessages: AnchorMessage[] = (Array.isArray(chunk) ? chunk : []).map(m => ({
			id: m._id,
			t: m.t,
			ts: tsToMs(m.ts)
		}));
		return anchorForServerChunk(anchorMessages, target.id, target.ts);
	}

	const localAnchor = await deps.getLocalAnchorTs(rid, target.ts);
	if (localAnchor != null) {
		return localAnchor;
	}
	return target.ts ? tsToMs(target.ts) : null;
};
