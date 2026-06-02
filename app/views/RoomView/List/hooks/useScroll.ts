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
	setHighTs
}: {
	listRef: TListRef;
	messages: TAnyMessageModel[];
	messagesIds: TMessagesIdsRef;
	setHighTs: (next: number | null) => void;
}) => {
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
	const viewableItems = useRef<ViewToken[] | null>(null);
	const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingJump = useRef<IPendingJump | null>(null);
	// The most recent jump target. FlatList may fire onScrollToIndexFailed AFTER completeJump has
	// already cleared pendingJump, so the retry handler reads this to recompute the actual target index.
	const lastJumpTargetId = useRef<string | null>(null);

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
			return;
		}
		jump.scrolled = true;
		listRef.current?.scrollToIndex({ index, viewPosition: 0.5, viewOffset: 100 });
		completeJump(jump);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on messages so it re-runs on every re-observe; messagesIds is a ref read at run time
	}, [messages]);

	// scroll-to-index-failed: the inverted list could not measure the target's frame yet (a
	// mid-window target can sit far past the initially-rendered rows). Retry toward the ACTUAL
	// target index computed from the current ids — not just highestMeasuredFrameIndex.
	const handleScrollToIndexFailed: IListProps['onScrollToIndexFailed'] = params => {
		const targetId = pendingJump.current?.messageId ?? lastJumpTargetId.current;
		const targetIndex = targetId ? messagesIds.current?.findIndex(id => id === targetId) ?? -1 : -1;
		const index = targetIndex !== -1 ? targetIndex : params.highestMeasuredFrameIndex;
		listRef.current?.scrollToIndex({ index, animated: false });
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
				listRef.current?.scrollToIndex({ index, viewPosition: 0.5, viewOffset: 100 });
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
