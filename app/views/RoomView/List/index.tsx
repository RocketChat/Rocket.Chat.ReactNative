import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';

import { useDebounce } from '~/lib/methods/helpers';
import EmptyRoom from './components/EmptyRoom';
import List from './components/List';
import { MessageRow } from '../components/MessageRow';
import { type IListContainerProps, type IListContainerRef, type IListProps } from '../definitions';
import { useMessages } from './hooks/useMessages';
import { useScroll } from './hooks/useScroll';

const ListContainer = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, t, onLongPress, showMessageInMainThread, hideSystemMessages, listRef, serverVersion }, ref) => {
		const [messages, messagesIds, fetchMessages, { highTs, setHighTs }] = useMessages({
			rid,
			tmid,
			showMessageInMainThread,
			hideSystemMessages,
			t,
			serverVersion
		});
		const { jumpToBottom, jumpToMessage, cancelJumpToMessage, highlightedMessageId } = useScroll({
			listRef,
			messages,
			messagesIds,
			highTs,
			setHighTs,
			fetchMessages
		});
		const oldestFirstMessages = useMemo(() => messages.toReversed(), [messages]);

		const onStartReached = useDebounce(() => {
			fetchMessages();
		}, 300);

		useEffect(() => onStartReached.cancel, [onStartReached]);

		useImperativeHandle(ref, () => ({
			jumpToMessage,
			cancelJumpToMessage,
			isMessageInWindow: (messageId: string) => messagesIds.current?.includes(messageId) ?? false
		}));

		const renderItem: IListProps['renderItem'] = ({ item, index }) => (
			<MessageRow
				item={item}
				previousItem={oldestFirstMessages[index - 1]}
				highlightedMessage={highlightedMessageId ?? undefined}
				onLongPress={onLongPress}
			/>
		);

		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} />
				<List
					listRef={listRef}
					data={oldestFirstMessages}
					extraData={highlightedMessageId}
					renderItem={renderItem}
					onStartReached={onStartReached}
					jumpToBottom={jumpToBottom}
					isAnchored={highTs != null}
				/>
			</>
		);
	}
);

export default ListContainer;
