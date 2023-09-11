import React, { useState } from 'react';
import { FlatListProps, View, Platform, StyleSheet } from 'react-native';
import moment from 'moment';

import List, { TListRef } from './List';
import { useMessages } from './useMessages';
import EmptyRoom from '../EmptyRoom';
import { useDebounce } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { loadMissedMessages, loadThreadMessages } from '../../../lib/methods';
import RefreshControl from './RefreshControl';

export interface IListContainerProps {
	renderRow: Function;
	rid: string;
	tmid?: string;
	loading: boolean;
	listRef: TListRef;
	hideSystemMessages: string[];
	tunread?: string[];
	ignored?: string[];
	navigation: any; // TODO: type me
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
}

const QUERY_SIZE = 50;

const RoomViewList = ({
	rid,
	tmid,
	renderRow,
	showMessageInMainThread,
	serverVersion,
	hideSystemMessages
}: IListContainerProps) => {
	console.count('RoomViewList');
	const [refreshing, setRefreshing] = useState(false);
	const [count, setCount] = useState(QUERY_SIZE);
	const messages = useMessages({ rid, tmid, showMessageInMainThread, serverVersion, count, hideSystemMessages });

	const onRefresh = async () => {
		setRefreshing(true);
		if (messages.length) {
			try {
				if (tmid) {
					await loadThreadMessages({ tmid, rid });
				} else {
					await loadMissedMessages({ rid, lastOpen: moment().subtract(7, 'days').toDate() });
				}
			} catch (e) {
				log(e);
			}
		}

		setRefreshing(false);
	};

	const onEndReached = useDebounce(() => {
		console.count('RoomViewList.onEndReached');
		setCount(prevCount => prevCount + QUERY_SIZE);
	}, 300);

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
			<RefreshControl refreshing={refreshing} onRefresh={onRefresh}>
				<List
					// onScroll={this.onScroll}
					// scrollEventThrottle={16}
					// listRef={listRef}
					data={messages}
					renderItem={renderItem}
					onEndReached={onEndReached}
					// ListFooterComponent={this.renderFooter}
					// onScrollToIndexFailed={this.handleScrollToIndexFailed}
					// onViewableItemsChanged={this.onViewableItemsChanged}
					// viewabilityConfig={this.viewabilityConfig}
				/>
			</RefreshControl>
		</>
	);
};

const styles = StyleSheet.create({
	inverted: {
		...Platform.select({
			android: {
				scaleY: -1
			}
		})
	}
});

export default RoomViewList;
