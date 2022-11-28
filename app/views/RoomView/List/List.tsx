import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import Animated from 'react-native-reanimated';

import scrollPersistTaps from '../../../lib/methods/helpers/scrollPersistTaps';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

const styles = StyleSheet.create({
	contentContainer: {
		paddingTop: 8
	}
});

export type IListProps = FlashListProps<any>;

// @ts-ignore
const List = ({ listRef, ...props }: IListProps) => (
	<AnimatedFlashList
		testID='room-view-messages'
		ref={listRef}
		keyExtractor={(item: any) => item.id}
		// @ts-ignore
		contentContainerStyle={styles.contentContainer}
		inverted
		estimatedItemSize={150}
		onEndReachedThreshold={0.5}
		{...props}
		{...scrollPersistTaps}
	/>
);

List.propTypes = {
	listRef: PropTypes.object
};

export default List;
