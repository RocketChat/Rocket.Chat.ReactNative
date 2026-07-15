import { type IMessage } from '../../../definitions';
import { tsToMs } from '../../../lib/dayjs';
import { anchorForServerChunk } from './anchorResolver';
import { type AnchorMessage, type IJumpAnchorDeps, type IJumpTarget } from '../definitions';

/**
 * Upper ts bound (ms) for the re-seeded window, or null to stay on the Live Tail.
 * Null for thread targets, missing rid, or inWindow. Otherwise:
 *  - fromServer: fetches one Chunk; a Newer Loader brackets the target (null if contiguous to Live Tail).
 *  - cached: reuses the existing Newer Loader bracket, or falls back to the target's own ts.
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
		const bound = anchorForServerChunk(anchorMessages, target.id, tsToMs(target.ts));
		if (__DEV__ && bound !== null) {
			const collisions = anchorMessages.filter(m => tsToMs(m.ts) === bound).length;
			if (collisions > 1) {
				console.warn(`[RoomView] jump anchor ts shared by ${collisions} rows; may land on wrong message`);
			}
		}
		return bound;
	}

	// The local path can't detect the equal-ts collision the server path warns about above:
	// getLocalAnchorTs returns only a scalar ts, so two cached rows sharing it are indistinguishable here.
	const localAnchor = await deps.getLocalAnchorTs(rid, target.ts);
	if (localAnchor != null) {
		return localAnchor;
	}
	const ms = tsToMs(target.ts);
	return Number.isFinite(ms) ? ms : null;
};
