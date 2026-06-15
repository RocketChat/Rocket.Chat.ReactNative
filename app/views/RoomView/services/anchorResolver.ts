import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { tsToMs } from '../../../lib/methods/helpers/tsToMs';

/**
 * Pure anchor-resolver for the bounded Message Window.
 *
 * The Room view observation can carry an optional UPPER `ts` bound (`highTs`). When it is
 * `null` the window is a Live Window (newest-first, follows the Live Tail). When it is a finite
 * number (ms since epoch) the window is an Anchored Window pinned below the Live Tail.
 *
 * This module decides what that bound should be, purely from the currently-visible rows:
 *  - `anchorForTarget` picks the bound for a fresh Jump to Message onto a target.
 *  - `raiseOrRelease` climbs the bound toward the Live Tail as Newer Loaders are consumed, and
 *    releases to a Live Window only once the Gap to the Live Tail has fully closed.
 *
 * It is intentionally free of React and the database so it can be unit-tested with plain objects.
 * A Newer Loader is a row whose `t === MessageTypeLoad.NEXT_CHUNK` (see UBIQUITOUS_LANGUAGE.md).
 */
export interface AnchorMessage {
	id: string;
	t?: string | null;
	ts: Date | number;
}

export const isNewerLoader = (message: AnchorMessage): boolean => message.t === MessageTypeLoad.NEXT_CHUNK;

/**
 * Resolve the upper bound for a Jump to Message onto `targetId`.
 *
 * Returns the ts (ms) of the nearest Newer Loader sitting ABOVE the target — the upper bracket of
 * the target's Chunk. Returns `null` when the target is absent, or when no Newer Loader sits above
 * it (the target is contiguous with the Live Tail, so the window should stay a Live Window).
 */
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

/**
 * Resolve the upper bound for a Jump to Message onto a target that was fetched from the server
 * (not cached locally), given the Chunk `loadSurroundingMessages` returned.
 *
 * - A Newer Loader above the target brackets its Chunk away from the Live Tail → anchor at it.
 * - Target present with no Newer Loader above it → the Chunk reaches the Live Tail → stay a Live
 *   Window (`null`). Anchoring here would pin the room in an Anchored Window with no boundary
 *   Loader: the anchor could never release, so newly arriving messages would never render.
 * - Target absent / empty Chunk → anchor at the target's own ts so the window still re-seeds onto it.
 */
export function anchorForServerChunk(
	messages: AnchorMessage[],
	targetId: string,
	targetTs: Date | number
): number | null {
	const bound = anchorForTarget(messages, targetId);
	if (bound !== null) {
		return bound;
	}
	const targetInChunk = messages.some(m => m.id === targetId);
	return targetInChunk ? null : tsToMs(targetTs);
}

/**
 * Climb the bound toward the Live Tail, or release the window to live.
 *
 * Returns the ts (ms) of the Newer Loader nearest the Live Tail (the maximum) while any Newer
 * Loader is still present — this guarantees we NEVER release across an open Gap. Returns `null`
 * only once no Newer Loader remains, i.e. the Gap to the Live Tail has closed.
 *
 * `currentHighTs` is part of the signature for symmetry and to document the monotonic climb: in
 * practice the returned value is >= `currentHighTs`.
 */
export function raiseOrRelease(messages: AnchorMessage[], currentHighTs: number | null): number | null {
	const loaders = messages.filter(isNewerLoader).map(m => tsToMs(m.ts));
	if (!loaders.length) {
		return null;
	}
	// Climb toward the Live Tail; clamp to currentHighTs so the bound never moves backwards.
	return Math.max(...loaders, currentHighTs ?? -Infinity);
}
