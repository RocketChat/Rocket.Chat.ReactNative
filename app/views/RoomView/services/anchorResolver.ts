import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { tsToMs } from '../../../lib/dayjs';
import { type AnchorMessage } from '../definitions';

// Pure anchor math for the bounded Message Window — no React, no DB (unit-tested with plain objects).
// Returns an upper ts bound (ms): null = Live Window, finite = Anchored Window. See docs/ARCHITECTURE.md.
export const isNewerLoader = (message: AnchorMessage): boolean => message.t === MessageTypeLoad.NEXT_CHUNK;

// Nearest Newer Loader ABOVE the target = upper bracket of its Chunk. null = target absent, or
// contiguous with the Live Tail (stay a Live Window).
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

// anchorForTarget for a freshly-fetched server Chunk. Target present with no Loader above = Chunk
// reaches the Live Tail, stay live (anchoring would pin an unreleasable window, blocking new messages).
// Target absent / empty Chunk = anchor at the target's own ts so the window still re-seeds onto it.
export function anchorForServerChunk(messages: AnchorMessage[], targetId: string, targetTs: Date | number): number | null {
	const bound = anchorForTarget(messages, targetId);
	if (bound !== null) {
		return bound;
	}
	const targetInChunk = messages.some(m => m.id === targetId);
	return targetInChunk ? null : tsToMs(targetTs);
}

// Max loader ts while any Newer Loader remains (never release across an open Gap); null only once
// none remain. Clamp to currentHighTs so the bound never moves backwards.
export function raiseOrRelease(messages: AnchorMessage[], currentHighTs: number | null): number | null {
	const loaders = messages.filter(isNewerLoader).map(m => tsToMs(m.ts));
	if (!loaders.length) {
		return null;
	}
	return Math.max(...loaders, currentHighTs ?? -Infinity);
}
