import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Platform, StyleSheet } from 'react-native';

import ActivityIndicator from '../../../containers/ActivityIndicator';
import { useMessages, useRefresh, useScroll } from './hooks';
import { useDebounce } from '../../../lib/methods/helpers';
import { RefreshControl, EmptyRoom, List } from './components';
import { IListContainerProps, IListContainerRef, IListProps } from './definitions';

const styles = StyleSheet.create({
	inverted: {
		...Platform.select({
			android: {
				scaleY: -1
			}
		})
	}
});

const ListContainer = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, renderRow, showMessageInMainThread, serverVersion, hideSystemMessages, listRef, loading }, ref) => {
		const [messages, messagesIds, fetchMessages] = useMessages({
			rid,
			tmid,
			showMessageInMainThread,
			serverVersion,
			hideSystemMessages
		});
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
		});

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

		const renderItem: IListProps['renderItem'] = ({ item, index }) => (
			<View style={styles.inverted}>{renderRow(item, messages[index + 1], highlightedMessageId)}</View>
		);

		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} />
				<RefreshControl refreshing={refreshing} onRefresh={refresh}>
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
					/>
				</RefreshControl>
			</>
		);
	}
);

export default ListContainer;
