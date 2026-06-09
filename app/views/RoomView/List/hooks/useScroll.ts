import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type ViewToken, type ViewabilityConfigCallbackPairs } from 'react-native';

import { type IListContainerRef, type IListProps, type TListRef, type TMessagesIdsRef } from '../definitions';
import { type TAnyMessageModel } from '../../../../definitions';
import { VIEWABILITY_CONFIG } from '../constants';

// Safety net for a Jump to Message: if the target never re-observes within this window we abort the
// anchor, drop back to the Live Tail and clear the spinner. It does NOT cancel a valid in-flight
// scroll — completion happens reactively the moment the target appears in the rendered rows.
const JUMP_SAFETY_TIMEOUT = 5000;
const HIGHLIGHT_TIMEOUT = 5000;

// Bounded growth for an Anchored Window jump: the anchor re-seeds to one page, but a target deeper than
// that first page (large Chunk / filtered rows between the bound and the target) is not in it yet. Each
// retry grows the window by one page (fetchMessages) to pull the target down into the rendered rows.
// Capped so a target that never materialises terminates into the safety-net abort instead of looping.
const MAX_JUMP_GROWTH_RETRIES = 5;

// onScrollToIndexFailed retry budget. VirtualizedList re-invokes onScrollToIndexFailed SYNCHRONOUSLY
// after a failed scrollToIndex, so we defer each retry one frame to break the recursion and cap the
// number of attempts so an unreachable/unmeasurable target terminates instead of spinning forever.
const SCROLL_TO_INDEX_RETRY_DELAY = 50;
const MAX_SCROLL_TO_INDEX_RETRIES = 5;

// Where a jumped-to message lands: centered, then pushed clear of the sticky room header so it is never
// hidden behind it. Shared by EVERY scrollToIndex in the jump path (initial scroll AND the
// onScrollToIndexFailed retry) so the landing position cannot drift between them.
const JUMP_SCROLL_POSITION = { viewPosition: 0.5, viewOffset: 100 } as const;

// A Jump to Message in flight: we re-anchor the Message Window, wait for the observation to re-emit
// with the target present, then scroll exactly once.
interface IPendingJump {
	messageId: string;
	// Whether this jump set an Anchored Window bound (so the abort path knows to release it).
	anchored: boolean;
	// Guards against scrolling more than once per jump as rows keep re-emitting.
	scrolled: boolean;
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
	// NOT migrated to the React Compiler ('use memo'): babel-plugin-react-compiler (rc) silently skips
	// any function whose body contains a react-hooks/exhaustive-deps suppression, and this hook keeps an
	// intentional incomplete effect-dep array (see the disable below). Annotating it would no-op, so the
	// manual useCallback here are load-bearing and must stay.
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
	const viewableItems = useRef<ViewToken[] | null>(null);
	const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingJump = useRef<IPendingJump | null>(null);
	// The most recent jump target. FlatList may fire onScrollToIndexFailed AFTER completeJump has
	// already cleared pendingJump, so the retry handler reads this to recompute the actual target index.
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

	// Snap straight back to live: release any Anchored Window first (the public setter re-seeds to one
	// page, which is correct here), then scroll to the Live Tail.
	const jumpToBottom = useCallback(() => {
		setHighTs(null);
		listRef.current?.scrollToOffset({ offset: -100 });
	}, [listRef, setHighTs]);

	const onViewableItemsChanged: IListProps['onViewableItemsChanged'] = ({ viewableItems: vi }) => {
		viewableItems.current = vi;
	};

	const viewabilityConfigCallbackPairs = useRef<ViewabilityConfigCallbackPairs>([
		{ onViewableItemsChanged, viewabilityConfig: VIEWABILITY_CONFIG }
	]);

	const setHighlightTimeout = useCallback(() => {
		if (highlightTimeout.current) {
			clearTimeout(highlightTimeout.current);
		}
		highlightTimeout.current = setTimeout(() => {
			setHighlightedMessageId(null);
		}, HIGHLIGHT_TIMEOUT);
	}, []);

	// Finish a jump: highlight the target, clear the spinner and resolve. The Anchored Window stays
	// in place (rejoining the Live Tail is a separate, explicit action).
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

	// Abort a jump that never resolved (target deleted / filtered out / never re-observed): release
	// any Anchored Window back to the Live Tail and clear the spinner. Never leaves the user stuck.
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

	// A jump scroll on the inverted list uses an ESTIMATED offset — there is no getItemLayout for these
	// variable-height messages — so it can undershoot while the target's row is still unmeasured (fresh
	// jump), landing the target above the viewport. The first scroll renders the row; once it has been
	// measured a second scroll lands precisely. Re-read the index in case the window shifted a row between.
	const scrollToTarget = useCallback(
		(messageId: string, index: number) => {
			listRef.current?.scrollToIndex({ index, ...JUMP_SCROLL_POSITION });
			setTimeout(() => {
				const settled = messagesIds.current?.findIndex(id => id === messageId) ?? -1;
				if (settled !== -1) {
					listRef.current?.scrollToIndex({ index: settled, ...JUMP_SCROLL_POSITION });
				}
			}, SCROLL_TO_INDEX_RETRY_DELAY);
		},
		[listRef, messagesIds]
	);

	// Reactive await-re-observe: every time the rendered rows change, check whether the pending
	// target has appeared. The first time it has, scroll once and complete. This replaces the old
	// recursive scroll-until-present loop.
	useLayoutEffect(() => {
		const jump = pendingJump.current;
		if (!jump || jump.scrolled) {
			return;
		}
		const index = messagesIds.current?.findIndex(id => id === jump.messageId) ?? -1;
		if (index === -1) {
			// Anchored target deeper than the current window: grow by one page (bounded) to pull it in.
			// The safety net still aborts if it never materialises after the cap.
			if (jump.anchored && jumpGrowthRetries.current < MAX_JUMP_GROWTH_RETRIES) {
				jumpGrowthRetries.current += 1;
				fetchMessages();
			}
			return;
		}
		jump.scrolled = true;
		scrollToTarget(jump.messageId, index);
		completeJump(jump);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on messages so it re-runs on every re-observe; messagesIds is a ref read at run time; fetchMessages is a stable trigger, not a dependency
	}, [messages]);

	// scroll-to-index-failed: the inverted list could not measure the target's frame yet (a mid-window
	// target can sit far past the initially-rendered rows). We still want to land on the ACTUAL target
	// index, but VirtualizedList re-fires onScrollToIndexFailed SYNCHRONOUSLY after a failed scrollToIndex
	// when there is no getItemLayout — retrying inline recurses until the stack overflows. So defer the
	// retry one frame (letting the list render & measure more rows first) and cap the attempts so an
	// unmeasurable target gives up gracefully instead of spinning forever.
	const handleScrollToIndexFailed: IListProps['onScrollToIndexFailed'] = params => {
		// Per-jump cap: once hit, stay capped for the rest of this jump. The only reset is at jump start
		// (jumpToMessage); resetting here would let a later failure restart the chain and defeat the cap.
		if (scrollFailRetries.current >= MAX_SCROLL_TO_INDEX_RETRIES) {
			return;
		}
		scrollFailRetries.current += 1;
		setTimeout(() => {
			// Re-read the target at fire time so a retry queued by a previous jump cannot scroll to a stale index.
			const targetId = pendingJump.current?.messageId ?? lastJumpTargetId.current;
			const targetIndex = targetId ? messagesIds.current?.findIndex(id => id === targetId) ?? -1 : -1;
			const index = targetIndex !== -1 ? targetIndex : params.highestMeasuredFrameIndex;
			listRef.current?.scrollToIndex({ index, animated: false, ...JUMP_SCROLL_POSITION });
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

			// Safety net only: fires only if the target never re-observes (it cannot interrupt a
			// completed scroll because completeJump clears it the moment the target appears).
			jump.safety = setTimeout(() => {
				if (pendingJump.current === jump && !jump.scrolled) {
					abortJump(jump);
				}
			}, JUMP_SAFETY_TIMEOUT);

			// Non-contiguous target → set the Anchored Window (re-seeds to one page centered on the
			// target's Chunk). Contiguous / thread / local targets keep their current window.
			if (anchored) {
				setHighTs(highTs as number);
			}

			// Target may already be present (contiguous / local case): try to resolve synchronously
			// against the current rows so we still perform exactly one scroll.
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
		viewabilityConfigCallbackPairs,
		handleScrollToIndexFailed,
		highlightedMessageId
	};
};
