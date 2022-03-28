import React from 'react';
import { FlatList, FlatListProps, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import PropTypes from 'prop-types';

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

export interface IListProps extends FlatListProps<any> {
	listRef: any;
}

const List = ({ listRef, ...props }: IListProps) => (
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

List.propTypes = {
	listRef: PropTypes.object
};

export default List;
