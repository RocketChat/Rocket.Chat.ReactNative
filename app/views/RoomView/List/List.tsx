import PropTypes from 'prop-types';
import React from 'react';
import { FlatListProps, StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { isIOS } from '../../../lib/methods/helpers';
import scrollPersistTaps from '../../../lib/methods/helpers/scrollPersistTaps';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

export type TListRef = React.RefObject<FlatList & { getNode: () => FlatList }>;

export interface IListProps extends FlatListProps<any> {
	listRef: TListRef;
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
