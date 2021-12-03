import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { isIOS } from '../../../utils/deviceInfo';
import scrollPersistTaps from '../../../utils/scrollPersistTaps';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

interface IRoomListProps {
	listRef: any;
	onScroll?: any;
	scrollEventThrottle?: number;
	data?: any;
	renderItem?: Function;
	onEndReached?: Function;
	ListFooterComponent?: Function;
	onScrollToIndexFailed?: Function;
	onViewableItemsChanged?: Function;
	viewabilityConfig?: any;
	refreshControl?: any;
}

const List = ({ listRef, ...props }: IRoomListProps) => (
	// @ts-ignore
	<AnimatedFlatList
		testID='room-view-messages'
		ref={listRef}
		keyExtractor={(item: any) => item.id}
		contentContainerStyle={styles.contentContainer}
		style={styles.list}
		inverted
		removeClippedSubviews={isIOS}
		initialNumToRender={7}
		onEndReachedThreshold={0.5}
		maxToRenderPerBatch={5}
		windowSize={10}
		{...props}
		{...scrollPersistTaps}
	/>
);

export default List;
