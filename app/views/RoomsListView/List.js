import React from 'react';
import { isEqual, orderBy } from 'lodash';
import { FlatList, ActivityIndicator } from 'react-native';
import withObservables from '@nozbe/with-observables';
import memoizeOne from 'memoize-one';

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

const List = ({ loading, subscriptions, ...props }) => {
	// if (loading) {
	// 	return <ActivityIndicator style={styles.loading} />;
	// }

	const sortedSubscriptions = order(subscriptions);
    // console.log('TCL: List -> sortedSubscriptions', sortedSubscriptions);
	return (
		<FlatList
			// ref={this.getScrollRef}
			data={sortedSubscriptions}
			extraData={sortedSubscriptions}
			// data={search.length ? search : chats}
			// contentOffset={isIOS ? { x: 0, y: SCROLL_OFFSET } : {}}
			keyExtractor={keyExtractor}
			style={styles.list}
			renderItem={({ item }) => {
				// const { width } = this.state;
				// const {
				// 	userId, username, token, baseUrl, StoreLastMessage
				// } = this.props;
				// const id = item.rid.replace(userId, '').trim();

				return (
					<RoomItem
						item={item}
						isRead={getIsRead(item)}
						name={getRoomTitle(item, props.useRealName)}
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
			}}
			// ListHeaderComponent={this.renderListHeader}
			getItemLayout={getItemLayout}
			// removeClippedSubviews
			keyboardShouldPersistTaps='always'
			initialNumToRender={9}
			windowSize={9}
		/>
	);
}

// const Item = withObservables(['subscriptions'], ({ subscriptions }) => ({
// 	subscriptions: subscriptions.observe()
// }))(List);

const EnhancedList = withObservables(['database'], ({ database }) => ({
	subscriptions: database.collections
		.get('subscriptions')
		.query()
		.observeWithColumns(['room_updated_at'])
}))(List);

export default EnhancedList;

