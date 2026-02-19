import { useCallback, useEffect, useRef, useState } from 'react';
import { type ViewToken } from '@shopify/flash-list';

import { type TAnyMessageModel } from '../../../../definitions';
import { type IListContainerRef, type IListProps, type TListRef, type TMessagesIdsRef } from '../definitions';
import { VIEWABILITY_CONFIG } from '../constants';

export const useScroll = ({ listRef, messagesIds }: { listRef: TListRef; messagesIds: TMessagesIdsRef }) => {
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
	const cancelJump = useRef(false);
	const jumping = useRef(false);
	const viewableItems = useRef<ViewToken<TAnyMessageModel>[] | null>(null);
	const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (highlightTimeout.current) {
				clearTimeout(highlightTimeout.current);
			}
		},
		[]
	);

	const jumpToBottom = useCallback(() => {
		listRef.current?.scrollToOffset({ offset: -100 });
	}, [listRef]);

	const onViewableItemsChanged: IListProps['onViewableItemsChanged'] = ({ viewableItems: vi }) => {
		viewableItems.current = vi;
	};

	const viewabilityConfigCallbackPairs = useRef<NonNullable<IListProps['viewabilityConfigCallbackPairs']>>([
		{ onViewableItemsChanged, viewabilityConfig: VIEWABILITY_CONFIG }
	]);

	const setHighlightTimeout = () => {
		if (highlightTimeout.current) {
			clearTimeout(highlightTimeout.current);
		}
		highlightTimeout.current = setTimeout(() => {
			setHighlightedMessageId(null);
		}, 5000);
	};

	const jumpToMessage: IListContainerRef['jumpToMessage'] = messageId =>
		new Promise<void>(async resolve => {
			// if jump to message was cancelled, reset variables and stop
			if (cancelJump.current) {
				resetJumpToMessage();
				return resolve();
			}
			jumping.current = true;

			// look for the message on the state
			const index = messagesIds.current?.findIndex(item => item === messageId) ?? -1;

			// if found message, scroll to it
			if (index !== -1) {
				listRef.current?.scrollToIndex({ index, viewPosition: 0.5, viewOffset: 100 }).catch(() => {
					listRef.current?.scrollToEnd();
				});

				// wait for scroll animation to finish
				await new Promise(res => setTimeout(res, 300));

				// if message is not visible
				if (!viewableItems.current?.map(vi => vi.key).includes(messageId)) {
					await setTimeout(() => resolve(jumpToMessage(messageId)), 300);
					return;
				}
				// if message is visible, highlight it
				setHighlightedMessageId(messageId);
				setHighlightTimeout();
				resetJumpToMessage();
				resolve();
			} else {
				// if message not on state yet, scroll to top, so it triggers onEndReached and try again
				listRef.current?.scrollToEnd();
				await setTimeout(() => resolve(jumpToMessage(messageId)), 600);
			}
		});

	const resetJumpToMessage = () => {
		cancelJump.current = false;
		jumping.current = false;
	};

	const cancelJumpToMessage: IListContainerRef['cancelJumpToMessage'] = () => {
		if (jumping.current) {
			cancelJump.current = true;
			return;
		}
		resetJumpToMessage();
	};

	return {
		jumpToBottom,
		jumpToMessage,
		cancelJumpToMessage,
		viewabilityConfigCallbackPairs,
		highlightedMessageId
	};
};
