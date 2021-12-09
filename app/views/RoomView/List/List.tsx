import React from 'react';
import { FlatList, FlatListProps, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { isIOS } from '../../../utils/deviceInfo';
import scrollPersistTaps from '../../../utils/scrollPersistTaps';
import { IRoomItem } from '../index';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

interface IRoomListProps extends FlatListProps<IRoomItem> {
	listRef: React.Ref<FlatList>;
	// listRef: React.MutableRefObject<AnimatedComponent<typeof FlatList>>;
}

const List = ({ listRef, ...props }: IRoomListProps): JSX.Element => (
	<AnimatedFlatList
		testID='room-view-messages'
		ref={listRef}
		// @ts-ignore
		keyExtractor={(item: IRoomItem) => item.id}
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
