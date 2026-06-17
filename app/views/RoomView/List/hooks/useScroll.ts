import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { type IListContainerRef, type IListProps, type TListRef, type TMessagesIdsRef } from '../definitions';
import { type TAnyMessageModel } from '../../../../definitions';

// Abort a jump whose target never re-observes within this window: release the anchor, drop to the Live
// Tail, clear the spinner. Does not cancel an in-flight scroll — completion is reactive on re-observe.
const JUMP_SAFETY_TIMEOUT = 5000;
const HIGHLIGHT_TIMEOUT = 5000;

// A target deeper than the anchor's first page needs the window grown one page per retry to pull it in.
// Capped so a target that never materialises aborts via the safety net instead of looping.
const MAX_JUMP_GROWTH_RETRIES = 5;

// VirtualizedList re-fires onScrollToIndexFailed synchronously, so defer each retry one frame to break
// the recursion.
const SCROLL_TO_INDEX_RETRY_DELAY = 50;
// A deep target can sit ~30 rows past the measured frontier; each retry climbs ~one render batch, so the
// cap must cover the distance (5 stalled short). Bounded so an unreachable target aborts, not loops.
const MAX_SCROLL_TO_INDEX_RETRIES = 20;

// Jump landing: centered, offset clear of the sticky header. Shared by every scrollToIndex in the jump
// path so the position cannot drift between them.
const JUMP_SCROLL_POSITION = { viewPosition: 0.5, viewOffset: 100 } as const;

// A Jump to Message in flight: re-anchor the window, wait for the target to re-emit, scroll once.
interface IPendingJump {
	messageId: string;
	anchored: boolean; // set an Anchored Window bound? the abort path releases it
	scrolled: boolean; // guards against scrolling more than once as rows re-emit
	resolve: () => void;
	safety: ReturnType<typeof setTimeout> | null;
}

export const useScroll = ({
	listRef,
	messages,
	messagesIds,
	setHighTs,
	fetchMessages
}: {
	listRef: TListRef;
	messages: TAnyMessageModel[];
	messagesIds: TMessagesIdsRef;
	setHighTs: (next: number | null) => void;
	fetchMessages: () => Promise<void>;
}) => {
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
	const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingJump = useRef<IPendingJump | null>(null);
	// Most recent jump target. onScrollToIndexFailed can fire after completeJump clears pendingJump, so
	// the retry handler reads this for the target index.
	const lastJumpTargetId = useRef<string | null>(null);
	// Bounds the onScrollToIndexFailed retry chain per jump (reset when a new jump starts).
	const scrollFailRetries = useRef(0);
	// Bounds the window-growth retries while waiting for a deep Anchored target to re-observe (reset per jump).
	const jumpGrowthRetries = useRef(0);

	useEffect(
		() => () => {
			if (highlightTimeout.current) {
				clearTimeout(highlightTimeout.current);
			}
			if (pendingJump.current?.safety) {
				clearTimeout(pendingJump.current.safety);
			}
		},
		[]
	);

	// Back to live: release any Anchored Window, then scroll to the Live Tail.
	const jumpToBottom = useCallback(() => {
		setHighTs(null);
		listRef.current?.scrollToOffset({ offset: -100 });
	}, [listRef, setHighTs]);

	const setHighlightTimeout = useCallback(() => {
		if (highlightTimeout.current) {
			clearTimeout(highlightTimeout.current);
		}
		highlightTimeout.current = setTimeout(() => {
			setHighlightedMessageId(null);
		}, HIGHLIGHT_TIMEOUT);
	}, []);

	// Finish a jump: highlight the target, clear the spinner, resolve. The Anchored Window stays put.
	const completeJump = useCallback(
		(jump: IPendingJump) => {
			if (jump.safety) {
				clearTimeout(jump.safety);
			}
			pendingJump.current = null;
			setHighlightedMessageId(jump.messageId);
			setHighlightTimeout();
			jump.resolve();
		},
		[setHighlightTimeout]
	);

	// Abort a jump that never resolved (target deleted / filtered / never re-observed): release any
	// Anchored Window and clear the spinner so the user is never stuck.
	const abortJump = useCallback(
		(jump: IPendingJump) => {
			if (jump.safety) {
				clearTimeout(jump.safety);
			}
			pendingJump.current = null;
			if (jump.anchored) {
				setHighTs(null);
			}
			jump.resolve();
		},
		[setHighTs]
	);

	// Arm/refresh the abort safety net. Refreshed on each productive growth so a deep, still-loading
	// target is not aborted mid-load; MAX_JUMP_GROWTH_RETRIES still guarantees termination.
	const armJumpSafety = useCallback(
		(jump: IPendingJump) => {
			if (jump.safety) {
				clearTimeout(jump.safety);
			}
			jump.safety = setTimeout(() => {
				if (pendingJump.current === jump && !jump.scrolled) {
					abortJump(jump);
				}
			}, JUMP_SAFETY_TIMEOUT);
		},
		[abortJump]
	);

	// No getItemLayout for these variable-height rows, so the first scroll uses an estimated offset and
	// can undershoot while the target is unmeasured. It renders the row; a second scroll lands precisely.
	// Re-read the index in case the window shifted a row between.
	const scrollToTarget = useCallback(
		(messageId: string, index: number) => {
			listRef.current?.scrollToIndex({ index, ...JUMP_SCROLL_POSITION });
			setTimeout(() => {
				// A newer jump may now own the scroll; re-reading this old target would yank the list off it.
				if (lastJumpTargetId.current !== messageId) {
					return;
				}
				const settled = messagesIds.current?.findIndex(id => id === messageId) ?? -1;
				if (settled !== -1) {
					listRef.current?.scrollToIndex({ index: settled, ...JUMP_SCROLL_POSITION });
				}
			}, SCROLL_TO_INDEX_RETRY_DELAY);
		},
		[listRef, messagesIds]
	);

	// On every re-observe, check whether the pending target has appeared; the first time it has, scroll
	// once and complete.
	useLayoutEffect(() => {
		const jump = pendingJump.current;
		if (!jump || jump.scrolled) {
			return;
		}
		const index = messagesIds.current?.findIndex(id => id === jump.messageId) ?? -1;
		if (index === -1) {
			// Anchored target deeper than the window: grow one page (bounded) to pull it in; the safety
			// net aborts if it never materialises.
			if (jump.anchored && jumpGrowthRetries.current < MAX_JUMP_GROWTH_RETRIES) {
				jumpGrowthRetries.current += 1;
				armJumpSafety(jump); // productive growth → grant the next page its own arrival window
				// A grow failure leaves the jump pending; the safety net aborts it, so swallow here.
				fetchMessages().catch(() => {});
			}
			return;
		}
		jump.scrolled = true;
		scrollToTarget(jump.messageId, index);
		completeJump(jump);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on messages so it re-runs on every re-observe; messagesIds is a ref read at run time; fetchMessages is a stable trigger, not a dependency
	}, [messages]);

	// The list could not measure the target's frame yet. VirtualizedList re-fires this synchronously with
	// no getItemLayout, so an inline retry recurses; defer one frame to render more rows, capped so an
	// unmeasurable target gives up.
	const handleScrollToIndexFailed: IListProps['onScrollToIndexFailed'] = params => {
		// Per-jump cap, reset only at jump start; resetting here would let a later failure defeat it.
		if (scrollFailRetries.current >= MAX_SCROLL_TO_INDEX_RETRIES) {
			return;
		}
		scrollFailRetries.current += 1;
		setTimeout(() => {
			// Re-read at fire time so a retry queued by a previous jump can't scroll to a stale index.
			const targetId = pendingJump.current?.messageId ?? lastJumpTargetId.current;
			const targetIndex = targetId ? messagesIds.current?.findIndex(id => id === targetId) ?? -1 : -1;
			if (targetIndex === -1) {
				return;
			}
			// Scrolling straight to an unmeasured target doesn't move the viewport, so the window plateaus
			// short. Step to the measured frontier first (that renders the next batch, advancing
			// highestMeasuredFrameIndex), then re-attempt — it lands once measured, or re-fires to climb on.
			if (targetIndex > params.highestMeasuredFrameIndex) {
				listRef.current?.scrollToIndex({ index: params.highestMeasuredFrameIndex, animated: false });
				setTimeout(() => {
					const settled =
						messagesIds.current?.findIndex(id => id === (pendingJump.current?.messageId ?? lastJumpTargetId.current)) ?? -1;
					if (settled !== -1) {
						listRef.current?.scrollToIndex({ index: settled, animated: false, ...JUMP_SCROLL_POSITION });
					}
				}, SCROLL_TO_INDEX_RETRY_DELAY);
				return;
			}
			listRef.current?.scrollToIndex({ index: targetIndex, animated: false, ...JUMP_SCROLL_POSITION });
		}, SCROLL_TO_INDEX_RETRY_DELAY);
	};

	const jumpToMessage: IListContainerRef['jumpToMessage'] = (messageId, highTs) =>
		new Promise<void>(resolve => {
			// Cancel any previous in-flight jump before starting a new one.
			if (pendingJump.current) {
				const previous = pendingJump.current;
				pendingJump.current = null;
				if (previous.safety) {
					clearTimeout(previous.safety);
				}
				previous.resolve();
			}

			lastJumpTargetId.current = messageId;
			scrollFailRetries.current = 0;
			jumpGrowthRetries.current = 0;
			const anchored = typeof highTs === 'number' && Number.isFinite(highTs);
			const jump: IPendingJump = {
				messageId,
				anchored,
				scrolled: false,
				resolve,
				safety: null
			};
			pendingJump.current = jump;

			// Safety net only: fires if the target never re-observes; completeJump clears it on arrival, so
			// it can't interrupt a completed scroll. Refreshed on each productive growth.
			armJumpSafety(jump);

			// Non-contiguous target → set the Anchored Window (re-seeds one page on the target's Chunk).
			// Contiguous / thread / local targets keep their current window.
			if (anchored) {
				setHighTs(highTs as number);
			}

			// Target may already be present (contiguous / local): resolve synchronously, still one scroll.
			const index = messagesIds.current?.findIndex(id => id === messageId) ?? -1;
			if (index !== -1 && !anchored) {
				jump.scrolled = true;
				scrollToTarget(messageId, index);
				completeJump(jump);
			}
		});

	const cancelJumpToMessage: IListContainerRef['cancelJumpToMessage'] = () => {
		const jump = pendingJump.current;
		if (!jump) {
			return;
		}
		// Do not yank a valid scroll mid-flight: if we already scrolled, let it complete normally.
		if (jump.scrolled) {
			return;
		}
		abortJump(jump);
	};

	return {
		jumpToBottom,
		jumpToMessage,
		cancelJumpToMessage,
		handleScrollToIndexFailed,
		highlightedMessageId
	};
};
