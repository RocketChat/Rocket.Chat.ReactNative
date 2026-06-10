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
		const { jumpToBottom, jumpToMessage, cancelJumpToMessage, handleScrollToIndexFailed, highlightedMessageId } = useScroll({
			listRef,
			messages,
			messagesIds,
			setHighTs,
			fetchMessages
		});

		const onEndReached = useDebounce(() => {
			fetchMessages();
		}, 300);

		useImperativeHandle(ref, () => ({
			jumpToMessage,
			cancelJumpToMessage,
			isMessageInWindow: (messageId: string) => messagesIds.current?.includes(messageId) ?? false
		}));

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
