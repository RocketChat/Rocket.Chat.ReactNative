import React, { useCallback } from 'react';
import { isEqual, orderBy, throttle } from 'lodash';
import { FlatList, ActivityIndicator } from 'react-native';
import withObservables from '@nozbe/with-observables';
import memoizeOne from 'memoize-one';
// import { debounce } from 'rxjs/operators';
import { fromEvent, interval, timer } from 'rxjs';

import styles from './styles';
import RoomItem, { ROW_HEIGHT } from '../../presentation/RoomItem';

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

const getIsRead = (item) => {
	let isUnread = (item.archived !== true && item.open === true); // item is not archived and not opened
	isUnread = isUnread && (item.unread > 0 || item.alert === true); // either its unread count > 0 or its alert
	return !isUnread;
}

const getRoomTitle = (item, useRealName) => {
	// const { useRealName } = this.props;
	return ((item.prid || useRealName) && item.fname) || item.name;
}

const order = memoizeOne((subscriptions) => orderBy(subscriptions, ['roomUpdatedAt'], ['desc']))

const List = React.memo(({ loading, subscriptions, ...props }) => {
	if (loading) {
		return <ActivityIndicator style={styles.loading} />;
	}

	console.log('RERENDER LIST')

	const renderItem = ({ item }) => {
		if (getRoomTitle(item, props.useRealName) === 'general') {
			console.log('RENDERITEM GENERAL')
		}
	
		return (
			<RoomItem
				item={item}
				// isRead={getIsRead(item)}
				isRead
				// name={getRoomTitle(item, props.useRealName)}
				name={item.name}
				userId={props.userId}
				username={props.username}
				token={props.token}
				baseUrl={props.baseUrl}
				showLastMessage={props.StoreLastMessage}
				// onPress={() => this._onPressItem(item)}
				// testID={`rooms-list-view-item-${ item.name }`}
				width={375}
				// toggleFav={this.toggleFav}
				// toggleRead={this.toggleRead}
				// hideChannel={this.hideChannel}
			/>
		);
	}

	const sortedSubscriptions = order(subscriptions);
    // console.log('TCL: List -> sortedSubscriptions', sortedSubscriptions);
	return (
		<FlatList
			// ref={this.getScrollRef}
			data={sortedSubscriptions}
			extraData={sortedSubscriptions}
			// data={search.length ? search : chats}
			// contentOffset={isIOS ? { x: 0, y: SCROLL_OFFSET } : {}}
			// keyExtractor={keyExtractor}
			style={styles.list}
			renderItem={renderItem}
			// ListHeaderComponent={this.renderListHeader}
			getItemLayout={getItemLayout}
			// removeClippedSubviews
			keyboardShouldPersistTaps='always'
			initialNumToRender={10}
			windowSize={10}
		/>
	);
})

// const Item = withObservables(['subscriptions'], ({ subscriptions }) => ({
// 	subscriptions: subscriptions.observe()
// }))(List);

const EnhancedList = withObservables(['database'], ({ database }) => ({
	subscriptions: database.collections
		.get('subscriptions')
		.query()
		.observeWithColumns(['room_updated_at'])
		// .pipe(debounce(() => timer(1000)))
}))(List);

export default EnhancedList;

