import PropTypes from 'prop-types';
import React from 'react';
import { FlatListProps, StyleSheet } from 'react-native';
// import { FlatList } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import Animated from 'react-native-reanimated';

import scrollPersistTaps from '../../../lib/methods/helpers/scrollPersistTaps';

const AnimatedFlatList = Animated.createAnimatedComponent(FlashList);

const styles = StyleSheet.create({
	contentContainer: {
		paddingTop: 10
	}
});

// export type TListRef = React.RefObject<FlatList & { getNode: () => FlatList }>;

export type IListProps = FlatListProps<any>;

// @ts-ignore
const List = ({ listRef, ...props }: IListProps) => (
	<AnimatedFlatList
		testID='room-view-messages'
		ref={listRef}
		keyExtractor={(item: any) => item.id}
		// @ts-ignore
		contentContainerStyle={styles.contentContainer}
		// style={styles.list}
		inverted
		estimatedItemSize={150}
		// removeClippedSubviews={isIOS}
		// initialNumToRender={7}
		onEndReachedThreshold={0.5}
		// maxToRenderPerBatch={5}
		// windowSize={10}
		{...props}
		{...scrollPersistTaps}
	/>
);

List.propTypes = {
	listRef: PropTypes.object
};

export default List;
