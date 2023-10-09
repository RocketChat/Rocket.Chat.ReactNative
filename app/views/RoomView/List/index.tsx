import React, { forwardRef, useImperativeHandle } from 'react';
import { RefreshControl } from 'react-native';

import ActivityIndicator from '../../../containers/ActivityIndicator';
import { useMessages, useRefresh, useScroll } from './hooks';
import { isIOS, useDebounce } from '../../../lib/methods/helpers';
import { EmptyRoom, List } from './components';
import { IListContainerProps, IListContainerRef, IListProps } from './definitions';
import { useTheme } from '../../../theme';

const ListContainer = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, renderRow, showMessageInMainThread, serverVersion, hideSystemMessages, listRef, loading }, ref) => {
		const [messages, messagesIds, fetchMessages] = useMessages({
			rid,
			tmid,
			showMessageInMainThread,
			serverVersion,
			hideSystemMessages
		});
		const { colors } = useTheme();
		const [refreshing, refresh] = useRefresh({ rid, tmid, messagesLength: messages.length });
		const {
			jumpToBottom,
			jumpToMessage,
			cancelJumpToMessage,
			viewabilityConfigCallbackPairs,
			handleScrollToIndexFailed,
			highlightedMessageId
		} = useScroll({ listRef, messagesIds });

		const onEndReached = useDebounce(() => {
			fetchMessages();
		}, 300);

		useImperativeHandle(ref, () => ({
			jumpToMessage,
			cancelJumpToMessage
		}));

		const renderFooter = () => {
			if (loading && rid) {
				return <ActivityIndicator />;
			}
			return null;
		};

		const renderItem: IListProps['renderItem'] = ({ item, index }) => renderRow(item, messages[index + 1], highlightedMessageId);

		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} />
				<List
					listRef={listRef}
					data={messages}
					renderItem={renderItem}
					onEndReached={onEndReached}
					ListFooterComponent={renderFooter}
					onScrollToIndexFailed={handleScrollToIndexFailed}
					viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
					jumpToBottom={jumpToBottom}
					isThread={!!tmid}
					refreshControl={
						isIOS ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.auxiliaryText} /> : undefined
					}
				/>
			</>
		);
	}
);

export default ListContainer;
