import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import { IListProps } from '../definitions';
import { useEmojiKeyboardHeight } from '../../../../lib/hooks/useEmojiKeyboard';

const styles = StyleSheet.create({
	contentContainer: {
		paddingTop: 10
	},
	// eslint-disable-next-line react-native/no-unused-styles
	verticallyInverted: Platform.OS === 'android' ? { transform: [{ scale: -1 }] } : { transform: [{ scaleY: -1 }] }
});

export const List = ({ listRef, jumpToBottom, isThread, ...props }: IListProps) => {
	// const [visible, setVisible] = useState(false);
	const { keyboardHeight } = useEmojiKeyboardHeight();

	const scrollViewStyle = useAnimatedStyle(
		() => ({
			transform: [{ translateY: keyboardHeight.value }, ...styles.verticallyInverted.transform]
		}),
		[]
	);

	// const scrollHandler = useAnimatedScrollHandler({
	// 	onScroll: event => {
	// 		if (event.contentOffset.y > SCROLL_LIMIT) {
	// 			runOnJS(setVisible)(true);
	// 		} else {
	// 			runOnJS(setVisible)(false);
	// 		}
	// 	}
	// });

	return (
		<>
			{/* @ts-ignore */}
			<Animated.FlatList
				testID='room-view-messages'
				ref={listRef}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.contentContainer}
				// style={styles.list}
				style={scrollViewStyle}
				inverted
				removeClippedSubviews={isIOS}
				initialNumToRender={7}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				scrollEventThrottle={16}
				// onScroll={scrollHandler}
				{...props}
				{...scrollPersistTaps}
			/>
			{/* <NavBottomFAB visible={visible} onPress={jumpToBottom} isThread={isThread} /> */}
		</>
	);
};
