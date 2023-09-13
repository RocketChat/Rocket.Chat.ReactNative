import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { FlatListProps, View, Platform, StyleSheet } from 'react-native';

import List from './List';
import { useMessages } from './useMessages';
import EmptyRoom from '../EmptyRoom';
import { useDebounce } from '../../../lib/methods/helpers';
import RefreshControl from './RefreshControl';
import { useRefresh } from './useRefresh';
import { useJump } from './useJump';
import { IListContainerProps, IListContainerRef } from './definitions';

const ListContainer = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, renderRow, showMessageInMainThread, serverVersion, hideSystemMessages, listRef }, ref) => {
		console.count(`ListContainer ${rid} ${tmid}`);
		const [messages, fetchMessages] = useMessages({ rid, tmid, showMessageInMainThread, serverVersion, hideSystemMessages });
		const [refreshing, refresh] = useRefresh({ rid, tmid, messagesLength: messages.length });
		const messagesIds = useRef<string[]>([]);
		const { jumpToBottom, jumpToMessage, cancelJumpToMessage, viewabilityConfigCallbackPairs, handleScrollToIndexFailed } =
			useJump({ listRef, messagesIds });

		// TODO: remove
		useEffect(
			() => () => {
				console.countReset(`ListContainer ${rid} ${tmid}`);
				console.countReset(`ListContainer.onEndReached ${rid} ${tmid}`);
			},
			[]
		);

		useEffect(() => {
			messagesIds.current = messages.map(m => m.id);
		}, [messages]);

		const onEndReached = useDebounce(() => {
			console.count(`ListContainer.onEndReached ${rid} ${tmid}`);
			fetchMessages();
		});

		useImperativeHandle(ref, () => ({
			jumpToMessage,
			cancelJumpToMessage
		}));

		const renderItem: FlatListProps<any>['renderItem'] = ({ item, index }) => (
			// const { messages, highlightedMessage } = this.state;
			// const { renderRow } = this.props;
			// <View style={styles.inverted}>{renderRow(item, messages[index + 1], highlightedMessage)}</View>
			// TODO: reevaluate second argument
			<View style={styles.inverted}>{renderRow(item, messages[index + 1], null)}</View>
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
						// ListFooterComponent={this.renderFooter}
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

const styles = StyleSheet.create({
	inverted: {
		...Platform.select({
			android: {
				scaleY: -1
			}
		})
	}
});

export default ListContainer;
