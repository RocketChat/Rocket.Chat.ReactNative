import { forwardRef, useImperativeHandle } from 'react';

import { useDebounce } from '../../../lib/methods/helpers';
import EmptyRoom from './components/EmptyRoom';
import List from './components/List';
import { type IListContainerProps, type IListContainerRef, type IListProps } from './definitions';
import { useMessages, useScroll } from './hooks';

const ListContainer = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, t, renderRow, showMessageInMainThread, hideSystemMessages, listRef, serverVersion }, ref) => {
		'use memo';

		const [messages, messagesIds, fetchMessages, { highTs, setHighTs }] = useMessages({
			rid,
			tmid,
			showMessageInMainThread,
			hideSystemMessages,
			t,
			serverVersion
		});
		const {
			jumpToBottom,
			jumpToMessage,
			cancelJumpToMessage,
			viewabilityConfigCallbackPairs,
			handleScrollToIndexFailed,
			highlightedMessageId
		} = useScroll({ listRef, messages, messagesIds, setHighTs });

		const onEndReached = useDebounce(() => {
			fetchMessages();
		}, 300);

		useImperativeHandle(ref, () => {
			const handle = {
				jumpToMessage,
				cancelJumpToMessage,
				isMessageInWindow: (messageId: string) => messagesIds.current?.includes(messageId) ?? false
			};
			// [JUMP-DBG] NATIVE-1229 #3: expose a deterministic jump driver for the debugger. Remove before commit.
			(globalThis as any).__listJump = handle.jumpToMessage;
			(globalThis as any).__listInWindow = handle.isMessageInWindow;
			return handle;
		});

		const renderItem: IListProps['renderItem'] = ({ item, index }) => renderRow(item, messages[index + 1], highlightedMessageId);

		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} />
				<List
					listRef={listRef}
					data={messages}
					renderItem={renderItem}
					onEndReached={onEndReached}
					onScrollToIndexFailed={handleScrollToIndexFailed}
					viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
					jumpToBottom={jumpToBottom}
					isAnchored={highTs != null}
					maintainVisibleContentPosition={{
						minIndexForVisible: 0,
						autoscrollToTopThreshold: 0
					}}
				/>
			</>
		);
	}
);

export default ListContainer;
