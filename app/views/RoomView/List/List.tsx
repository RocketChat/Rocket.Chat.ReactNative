import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';

import { isIOS } from '../../../lib/methods/helpers';
import scrollPersistTaps from '../../../lib/methods/helpers/scrollPersistTaps';
import NavBottomFAB from './NavBottomFAB';
import { IListProps } from './definitions';
import { SCROLL_LIMIT } from './constants';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

const List = ({ listRef, jumpToBottom, isThread, ...props }: IListProps) => {
	const [visible, setVisible] = useState(false);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			if (event.contentOffset.y > SCROLL_LIMIT) {
				runOnJS(setVisible)(true);
			} else {
				runOnJS(setVisible)(false);
			}
		}
	});

	return (
		<>
			<AnimatedFlatList
				testID='room-view-messages'
				ref={listRef}
				keyExtractor={(item: any) => item.id}
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				inverted={isIOS}
				removeClippedSubviews={isIOS}
				initialNumToRender={7}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				scrollEventThrottle={16}
				onScroll={scrollHandler}
				{...props}
				{...scrollPersistTaps}
			/>
			<NavBottomFAB visible={visible} onPress={jumpToBottom} isThread={isThread} />
		</>
	);
};

export default List;
