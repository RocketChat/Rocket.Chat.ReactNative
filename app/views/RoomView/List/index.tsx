import { forwardRef, useEffect, useImperativeHandle } from 'react';

import { type RoomType, type TAnyMessageModel } from '../../../definitions';
import { useDebounce } from '../../../lib/methods/helpers';
import EmptyRoom from './components/EmptyRoom';
import List from './components/List';
import { MessageRow } from '../components/MessageRow';
import { type IListContainerRef, type IListProps, type TListRef } from '../definitions';
import { useMessages } from './hooks/useMessages';
import { useScroll } from './hooks/useScroll';

interface IListContainerProps {
	onLongPress: (item: TAnyMessageModel) => void;
	rid: string;
	t: RoomType;
	tmid?: string;
	flatListRef: TListRef;
	hideSystemMessages: string[];
	showMessageInMainThread: boolean;
	serverVersion: string | null;
}

const ListContainer = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, t, onLongPress, showMessageInMainThread, hideSystemMessages, flatListRef, serverVersion }, ref) => {
		const [messages, messagesIds, fetchMessages, { highTs, setHighTs }] = useMessages({
			rid,
			tmid,
			showMessageInMainThread,
			hideSystemMessages,
			t,
			serverVersion
		});
		const { jumpToBottom, jumpToMessage, cancelJumpToMessage, handleScrollToIndexFailed, highlightedMessageId, isReleasing } =
			useScroll({
				flatListRef,
				messages,
				messagesIds,
				highTs,
				setHighTs,
				fetchMessages
			});

		const onEndReached = useDebounce(() => {
			fetchMessages();
		}, 300);

		useEffect(() => onEndReached.cancel, [onEndReached]);

		useImperativeHandle(ref, () => ({
			jumpToMessage,
			cancelJumpToMessage,
			isMessageInWindow: (messageId: string) => messagesIds.current?.includes(messageId) ?? false
		}));

		const renderItem: IListProps['renderItem'] = ({ item, index }) => (
			<MessageRow
				item={item}
				previousItem={messages[index + 1]}
				highlightedMessage={highlightedMessageId ?? undefined}
				onLongPress={onLongPress}
			/>
		);

		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} />
				<List
					flatListRef={flatListRef}
					data={messages}
					renderItem={renderItem}
					onEndReached={onEndReached}
					onScrollToIndexFailed={handleScrollToIndexFailed}
					jumpToBottom={jumpToBottom}
					isAnchored={highTs != null}
					maintainVisibleContentPosition={
						isReleasing
							? undefined
							: {
									minIndexForVisible: 0,
									autoscrollToTopThreshold: 0
								}
					}
				/>
			</>
		);
	}
);

export default ListContainer;
