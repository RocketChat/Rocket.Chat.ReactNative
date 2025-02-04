import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, Text } from 'react-native';

import ActivityIndicator from '../../../containers/ActivityIndicator';
import { isAndroid, useDebounce } from '../../../lib/methods/helpers';
import { EmptyRoom, List } from './components';
import { IListContainerProps, IListContainerRef, IListProps } from './definitions';
import { useMessages, useScroll } from './hooks';

const styles = StyleSheet.create({
	inverted: {
		...Platform.select({
			android: {
				scaleY: -1
			}
		})
	}
});

const Container = ({ children }: { children: React.ReactElement }) =>
	isAndroid ? <View style={{ flex: 1, scaleY: -1 }}>{children}</View> : <>{children}</>;

const ListContainer = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, renderRow, showMessageInMainThread, serverVersion, hideSystemMessages, listRef, loading }, ref) => {
		const [messages, messagesIds, fetchMessages] = useMessages({
			rid,
			tmid,
			showMessageInMainThread,
			serverVersion,
			hideSystemMessages
		});
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
		function getTimestampOneWeekAgo() {
			const now = Date.now();
			const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
			return oneWeekAgo;
		}
		const renderItem: IListProps['renderItem'] = ({ item, index }) => (
			<View style={styles.inverted}>{renderRow(item, messages[index + 1], highlightedMessageId)}</View>
		);

		const [test, setTest] = useState(1);

		return (
			<>
				<TouchableOpacity onPress={() => setTest(test + 1)} style={{ width: 100, height: 100, backgroundColor: 'blue' }}>
					<Text>INCREASE</Text>
				</TouchableOpacity>
				<EmptyRoom rid={rid} length={messages.length} />
				<Container>
					<List
						listRef={listRef}
						data={messages.filter(item => (item.ts as any) > getTimestampOneWeekAgo()).slice(0, test)}
						renderItem={renderItem}
						onEndReached={onEndReached}
						ListFooterComponent={renderFooter}
						onScrollToIndexFailed={handleScrollToIndexFailed}
						viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
						jumpToBottom={jumpToBottom}
						isThread={!!tmid}
						maintainVisibleContentPosition={{
							minIndexForVisible: 0,
							autoscrollToTopThreshold: 0
						}}
					/>
				</Container>
			</>
		);
	}
);

export default ListContainer;
