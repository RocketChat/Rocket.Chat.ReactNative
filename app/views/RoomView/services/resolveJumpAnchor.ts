import { type IMessage } from '../../../definitions';
import { tsToMs } from '../../../lib/dayjs';
import { anchorForServerChunk } from './anchorResolver';
import { type AnchorMessage, type IJumpAnchorDeps, type IJumpTarget } from '../definitions';

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
		return anchorForServerChunk(anchorMessages, target.id, tsToMs(target.ts));
	}

	const localAnchor = await deps.getLocalAnchorTs(rid, target.ts);
	if (localAnchor != null) {
		return localAnchor;
	}
	const targetMs = tsToMs(target.ts);
	return Number.isFinite(targetMs) ? targetMs : null;
};
