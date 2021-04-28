import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { isIOS } from '../../../utils/deviceInfo';
import scrollPersistTaps from '../../../utils/scrollPersistTaps';

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

const getItemLayout = (data, index) => ({
	length: 50,
	offset: 50 * index,
	index
});

const List = ({ listRef, ...props }) => (
	<FlatList
		testID='room-view-messages'
		ref={listRef}
		keyExtractor={item => item.id}
		getItemLayout={getItemLayout}
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
