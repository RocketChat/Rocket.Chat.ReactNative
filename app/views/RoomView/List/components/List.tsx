import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';

import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import NavBottomFAB from './NavBottomFAB';
import { IListProps } from '../definitions';
import { SCROLL_LIMIT } from '../constants';

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10,
		flexDirection: 'column-reverse',
		flexGrow: 1
	}
});

export const List = ({ listRef, jumpToBottom, isThread, ...props }: IListProps) => {
	const [visible, setVisible] = useState(false);
	const [contentHeight, setContentHeight] = useState(0);
    const [layoutHeight, setLayoutHeight] = useState(0);

    const maxScrollY = contentHeight - layoutHeight;

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			if (event.contentOffset.y < (maxScrollY - SCROLL_LIMIT)) {
				runOnJS(setVisible)(true);
			} else {
				runOnJS(setVisible)(false);
			}
		}
	});

	return (
		<>
			{/* @ts-ignore */}
			<Animated.FlatList
				testID='room-view-messages'
				ref={listRef}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				onLayout={(e) => {setLayoutHeight(e.nativeEvent.layout.height);}}
                onContentSizeChange={(w, h) => {setContentHeight(h);}}
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
