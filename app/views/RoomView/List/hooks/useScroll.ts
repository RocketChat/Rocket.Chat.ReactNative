import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { type IListContainerRef, type IListProps, type TListRef, type TMessagesIdsRef } from '../../definitions';
import { type TAnyMessageModel } from '../../../../definitions';

// Abort a jump whose target never re-observes within this window: release the anchor, drop to the Live
// Tail, resolve the jump. Does not cancel an in-flight scroll — completion is reactive on re-observe.
const JUMP_SAFETY_TIMEOUT = 5000;
const HIGHLIGHT_TIMEOUT = 5000;

// A target deeper than the Anchored Window's initial QUERY_SIZE rows needs the window grown by QUERY_SIZE per retry to pull it in.
// Capped so a target that never materialises aborts via the safety net instead of looping.
const MAX_JUMP_GROWTH_RETRIES = 5;

// VirtualizedList re-fires onScrollToIndexFailed synchronously, so defer each retry one frame to break
// the recursion.
const SCROLL_TO_INDEX_RETRY_DELAY = 50;
// A deep target can sit ~30 rows past the measured frontier; each retry climbs ~one render batch, so the
// cap must cover the distance (5 stalled short). Bounded so an unreachable target aborts, not loops.
const MAX_SCROLL_TO_INDEX_RETRIES = 20;

// animated:false snaps straight to the target instead of smooth-scrolling through every row between here
// and a deep index — the latter reads as the list "hunting" for the message across several visible scrolls.
const JUMP_SCROLL_POSITION = {
	viewPosition: 0.5,
	viewOffset: 100,
	animated: false
} as const;

// A Jump to Message in flight: re-anchor the window, wait for the target to re-emit, scroll once.
interface IPendingJump {
	messageId: string;
	anchored: boolean; // set an Anchored Window bound? the abort path releases it
	scrolled: boolean; // guards against scrolling more than once as rows re-emit
	resolve: () => void;
	safety: ReturnType<typeof setTimeout> | null;
}

export const useScroll = ({
	flatListRef,
	messages,
	messagesIds,
	highTs,
	setHighTs,
	fetchMessages
}: {
	flatListRef: TListRef;
	messages: TAnyMessageModel[];
	messagesIds: TMessagesIdsRef;
	highTs: number | null;
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
	// A jump-to-bottom deferred until the released live window emits (set when releasing an Anchored Window).
	const pendingBottom = useRef(false);
	// True across an Anchored → Live release: suppresses maintainVisibleContentPosition so the disjoint
	// data swap can't apply a native offset adjustment that drags the pre-pinned viewport off-content.
	const [isReleasing, setIsReleasing] = useState(false);

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

	// Back to live from an Anchored Window. The release swaps the (tall) anchored rows for the disjoint,
	// shorter live tail in a single emit; a scroll offset deep enough for the tall content then sits past
	// the short content, and an inverted list renders that as a blank wedge with the FAB stuck visible.
	// Park the viewport at offset 0 (newest) BEFORE the swap: offset 0 is valid for any non-empty window,
	// so the shorter tail cannot strand it, and scrolling the already-settled anchored content sidesteps
	// the post-shrink layout race a deferred correction loses to. Suppress MVCP across the swap so its
	// offset adjustment for the disjoint key set cannot drag the viewport back off-content.
	const jumpToBottom = () => {
		if (highTs != null) {
			flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
			pendingBottom.current = true;
			setIsReleasing(true);
			setHighTs(null);
			return;
		}
		flatListRef.current?.scrollToOffset({ offset: -100 });
	};

	const setHighlightTimeout = () => {
		if (highlightTimeout.current) {
			clearTimeout(highlightTimeout.current);
		}
		highlightTimeout.current = setTimeout(() => {
			setHighlightedMessageId(null);
		}, HIGHLIGHT_TIMEOUT);
	};

	// Finish a jump: highlight the target, resolve. The Anchored Window stays put.
	const completeJump = (jump: IPendingJump) => {
		if (jump.safety) {
			clearTimeout(jump.safety);
		}
		pendingJump.current = null;
		setHighlightedMessageId(jump.messageId);
		setHighlightTimeout();
		jump.resolve();
	};

	// Abort a jump that never resolved (target deleted / filtered / never re-observed): release any
	// Anchored Window and resolve so the caller is never stuck.
	const abortJump = (jump: IPendingJump) => {
		if (jump.safety) {
			clearTimeout(jump.safety);
		}
		pendingJump.current = null;
		if (jump.anchored) {
			setHighTs(null);
		}
		jump.resolve();
	};

	// Arm/refresh the abort safety net. Refreshed on each productive growth so a deep, still-loading
	// target is not aborted mid-load; MAX_JUMP_GROWTH_RETRIES still guarantees termination.
	const armJumpSafety = (jump: IPendingJump) => {
		if (jump.safety) {
			clearTimeout(jump.safety);
		}
		jump.safety = setTimeout(() => {
			if (pendingJump.current === jump && !jump.scrolled) {
				abortJump(jump);
			}
		}, JUMP_SAFETY_TIMEOUT);
	};

	// Re-scroll once the target's row has settled into the measured window. No-op until it has.
	const reScrollWhenSettled = (targetId: string | null | undefined) => {
		const settled = targetId ? (messagesIds.current?.findIndex(id => id === targetId) ?? -1) : -1;
		if (settled !== -1) {
			flatListRef.current?.scrollToIndex({
				index: settled,
				...JUMP_SCROLL_POSITION
			});
		}
	};

	// No getItemLayout for these variable-height rows, so the first scroll uses an estimated offset and
	// can undershoot while the target is unmeasured. It renders the row; a second scroll lands precisely.
	// Re-read the index in case the window shifted a row between.
	const scrollToTarget = (messageId: string, index: number) => {
		flatListRef.current?.scrollToIndex({ index, ...JUMP_SCROLL_POSITION });
		setTimeout(() => {
			// A newer jump may now own the scroll; re-reading this old target would yank the list off it.
			if (lastJumpTargetId.current !== messageId) {
				return;
			}
			reScrollWhenSettled(messageId);
		}, SCROLL_TO_INDEX_RETRY_DELAY);
	};

	// Release settled: the live tail has emitted (keyed on messages so this runs on the first live emit)
	// and the viewport is already pinned at offset 0 from the pre-swap scroll. Re-pin in case the swap
	// nudged it, then restore maintainVisibleContentPosition for normal live-tail following (safe at
	// offset 0 — minIndexForVisible:0 keeps the newest row stable).
	useLayoutEffect(() => {
		if (!pendingBottom.current) {
			return;
		}
		pendingBottom.current = false;
		flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
		// eslint-disable-next-line react-hooks/set-state-in-effect -- the cascade is the fix: the swap render must paint with MVCP suppressed, the follow-up render restores it
		setIsReleasing(false);
	}, [messages, flatListRef]);

	// On every re-observe, check whether the pending target has appeared; the first time it has, scroll
	// once and complete.
	const onReObserve = () => {
		const jump = pendingJump.current;
		if (!jump || jump.scrolled) {
			return;
		}
		const index = messagesIds.current?.findIndex(id => id === jump.messageId) ?? -1;
		if (index === -1) {
			// Anchored target deeper than the window: grow it by QUERY_SIZE (bounded) to pull it in; the safety
			// net aborts if it never materialises.
			if (jump.anchored && jumpGrowthRetries.current < MAX_JUMP_GROWTH_RETRIES) {
				jumpGrowthRetries.current += 1;
				armJumpSafety(jump); // productive growth → grant the next growth step its own arrival window
				// A grow failure leaves the jump pending; the safety net aborts it, so swallow here.
				fetchMessages().catch(() => {});
			}
			return;
		}
		jump.scrolled = true;
		scrollToTarget(jump.messageId, index);
		completeJump(jump);
	};

	// Latest-closure ref so the trigger effect can key on messages alone (one run per re-observe) with
	// honest deps: fetchMessages re-keys on highTs, so listing the handler would also fire this mid-jump.
	const onReObserveRef = useRef(onReObserve);
	// Refreshed in a layout effect declared first — layout effects run in declaration order, so the
	// trigger below always reads this commit's closure.
	useLayoutEffect(() => {
		onReObserveRef.current = onReObserve;
	});
	useLayoutEffect(() => {
		onReObserveRef.current();
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
			const targetIndex = targetId ? (messagesIds.current?.findIndex(id => id === targetId) ?? -1) : -1;
			if (targetIndex === -1) {
				return;
			}
			// Scrolling straight to an unmeasured target doesn't move the viewport, so the window plateaus
			// short. Step to the measured frontier first (that renders the next batch, advancing
			// highestMeasuredFrameIndex), then re-attempt — it lands once measured, or re-fires to climb on.
			if (targetIndex > params.highestMeasuredFrameIndex) {
				flatListRef.current?.scrollToIndex({
					index: params.highestMeasuredFrameIndex,
					animated: false
				});
				setTimeout(() => {
					reScrollWhenSettled(pendingJump.current?.messageId ?? lastJumpTargetId.current);
				}, SCROLL_TO_INDEX_RETRY_DELAY);
				return;
			}
			flatListRef.current?.scrollToIndex({
				index: targetIndex,
				...JUMP_SCROLL_POSITION
			});
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

			// Non-contiguous target → set the Anchored Window (re-seeds a QUERY_SIZE window onto the target's Chunk).
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
		highlightedMessageId,
		isReleasing
	};
};
