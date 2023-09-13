import { useRef } from 'react';
import { FlatListProps, ViewToken, ViewabilityConfigCallbackPairs } from 'react-native';

import { TListRef, TMessagesIdsRef } from './definitions';
import { VIEWABILITY_CONFIG } from './constants';

export const useJump = ({ listRef, messagesIds }: { listRef: TListRef; messagesIds: TMessagesIdsRef }) => {
	const cancelJump = useRef(false);
	const jumping = useRef(false);
	const viewableItems = useRef<ViewToken[] | null>(null);

	const jumpToBottom = () => {
		listRef.current?.scrollToOffset({ offset: -100 });
	};

	const onViewableItemsChanged: FlatListProps<any>['onViewableItemsChanged'] = ({ viewableItems: vi }) => {
		viewableItems.current = vi;
	};

	const viewabilityConfigCallbackPairs = useRef<ViewabilityConfigCallbackPairs>([
		{ onViewableItemsChanged, viewabilityConfig: VIEWABILITY_CONFIG }
	]);

	const handleScrollToIndexFailed: FlatListProps<any>['onScrollToIndexFailed'] = params => {
		listRef.current?.scrollToIndex({ index: params.highestMeasuredFrameIndex, animated: false });
	};

	const jumpToMessage: (messageId: string) => Promise<void> = messageId =>
		new Promise<void>(async resolve => {
			// if jump to message was cancelled, reset variables and stop
			if (cancelJump.current) {
				resetJumpToMessage();
				return resolve();
			}
			jumping.current = true;

			// look for the message on the state
			const index = messagesIds.current?.findIndex(item => item === messageId);

			// if found message, scroll to it
			if (index && index > -1) {
				listRef.current?.scrollToIndex({ index, viewPosition: 0.5, viewOffset: 100 });

				// wait for scroll animation to finish
				await new Promise(res => setTimeout(res, 300));

				// if message is not visible
				if (!viewableItems.current?.map(vi => vi.key).includes(messageId)) {
					await setTimeout(() => resolve(jumpToMessage(messageId)), 300);
					return;
				}
				// if message is visible, highlight it
				// this.setState({ highlightedMessage: messageId });
				// this.clearHighlightedMessageTimeout();
				// // clears highlighted message after some time
				// this.highlightedMessageTimeout = setTimeout(() => {
				// 	this.setState({ highlightedMessage: null });
				// }, 5000);
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

	const cancelJumpToMessage: () => void = () => {
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
		handleScrollToIndexFailed
	};
};
