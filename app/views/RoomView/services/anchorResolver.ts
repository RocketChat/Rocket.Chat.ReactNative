import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { tsToMs } from '../../../lib/dayjs';
import { type AnchorMessage } from '../definitions';

export const isNewerLoader = (message: AnchorMessage): boolean => message.t === MessageTypeLoad.NEXT_CHUNK;

export function anchorForTarget(messages: AnchorMessage[], targetId: string): number | null {
	const target = messages.find(m => m.id === targetId);
	if (!target) {
		return null;
	}

	const targetTs = tsToMs(target.ts);
	let bound: number | null = null;

	for (const message of messages) {
		if (!isNewerLoader(message)) {
			continue;
		}
		const ts = tsToMs(message.ts);
		if (ts > targetTs && (bound === null || ts < bound)) {
			bound = ts;
		}
	}

	return bound;
}

export function anchorForServerChunk(messages: AnchorMessage[], targetId: string, targetTs: Date | number): number | null {
	const bound = anchorForTarget(messages, targetId);
	if (bound !== null) {
		return bound;
	}
	const targetInChunk = messages.some(m => m.id === targetId);
	return targetInChunk ? null : tsToMs(targetTs);
}

export function raiseOrRelease(messages: AnchorMessage[], currentHighTs: number | null): number | null {
	const loaders = messages.filter(isNewerLoader).map(m => tsToMs(m.ts));
	if (!loaders.length) {
		return null;
	}
	return Math.max(...loaders, currentHighTs ?? -Infinity);
}
