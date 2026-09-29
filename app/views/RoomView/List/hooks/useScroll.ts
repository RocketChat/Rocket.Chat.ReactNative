import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { type IListContainerRef, type TListRef, type TMessagesIdsRef } from '~/views/RoomView/definitions';
import { type TAnyMessageModel } from '~/definitions';

// Abort a jump whose target never re-observes within this window: release the anchor, drop to the Live
// Tail, resolve the jump. Does not cancel an in-flight scroll — completion is reactive on re-observe.
const JUMP_SAFETY_TIMEOUT = 5000;
const HIGHLIGHT_TIMEOUT = 5000;

// A target deeper than the Anchored Window's initial QUERY_SIZE rows needs the window grown by QUERY_SIZE per retry to pull it in.
// Capped so a target that never materialises aborts via the safety net instead of looping.
const MAX_JUMP_GROWTH_RETRIES = 5;

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
	listRef,
	messages,
	messagesIds,
	highTs,
	setHighTs,
	fetchMessages
}: {
	listRef: TListRef;
	messages: TAnyMessageModel[];
	messagesIds: TMessagesIdsRef;
	highTs: number | null;
	setHighTs: (next: number | null) => void;
	fetchMessages: () => Promise<void>;
}) => {
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
	const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingJump = useRef<IPendingJump | null>(null);
	// Bounds the window-growth retries while waiting for a deep Anchored target to re-observe (reset per jump).
	const jumpGrowthRetries = useRef(0);
	// A jump-to-bottom deferred until the released live window emits (set when releasing an Anchored Window).
	const pendingBottom = useRef(false);

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

	// Back to live from an Anchored Window: release the bound, then scroll to the end once the live tail emits.
	const jumpToBottom = () => {
		if (highTs != null) {
			pendingBottom.current = true;
			setHighTs(null);
			return;
		}
		listRef.current?.scrollToEnd({ animated: true });
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

	// messagesIds is newest-first; the list renders oldest-first.
	const listIndexOfMessage = (messageId: string) => {
		const ids = messagesIds.current ?? [];
		const newestFirstIndex = ids.indexOf(messageId);
		return newestFirstIndex === -1 ? -1 : ids.length - 1 - newestFirstIndex;
	};

	const scrollToTarget = (index: number) => {
		listRef.current?.scrollToIndex({ index, ...JUMP_SCROLL_POSITION });
	};

	useLayoutEffect(() => {
		if (!pendingBottom.current) {
			return;
		}
		pendingBottom.current = false;
		listRef.current?.scrollToEnd({ animated: false });
	}, [messages, listRef]);

	// On every re-observe, check whether the pending target has appeared; the first time it has, scroll
	// once and complete.
	const onReObserve = () => {
		const jump = pendingJump.current;
		if (!jump || jump.scrolled) {
			return;
		}
		const index = listIndexOfMessage(jump.messageId);
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
		scrollToTarget(index);
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

	const jumpToMessage: IListContainerRef['jumpToMessage'] = (messageId, highTsMs) =>
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

			jumpGrowthRetries.current = 0;
			const anchored = typeof highTsMs === 'number' && Number.isFinite(highTsMs);
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
				setHighTs(highTsMs as number);
			}

			// Target may already be present (contiguous / local): resolve synchronously, still one scroll.
			const index = listIndexOfMessage(messageId);
			if (index !== -1 && !anchored) {
				jump.scrolled = true;
				scrollToTarget(index);
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
		highlightedMessageId
	};
};
