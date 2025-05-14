import React, { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, {
	runOnJS,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue
} from 'react-native-reanimated';
import { KeyboardController, useKeyboardHandler, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import NavBottomFAB from './NavBottomFAB';
import { IListProps } from '../definitions';
import { SCROLL_LIMIT } from '../constants';
import { useEmojiKeyboard, useEmojiKeyboardHeight } from '../../../../lib/hooks/useEmojiKeyboard';

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	},
	verticallyInverted: Platform.OS === 'android' ? { transform: [{ scale: -1 }] } : { transform: [{ scaleY: -1 }] }
});

export const List = ({ listRef, jumpToBottom, isThread, ...props }: IListProps) => {
	const [visible, setVisible] = useState(false);
	const { keyboardHeight } = useEmojiKeyboardHeight();

	const scrollViewStyle = useAnimatedStyle(
		() => ({
			transform: [{ translateY: keyboardHeight.value }, ...styles.verticallyInverted.transform]
		}),
		[]
	);

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
				onScroll={scrollHandler}
				{...props}
				{...scrollPersistTaps}
			/>
			{/* <NavBottomFAB visible={visible} onPress={jumpToBottom} isThread={isThread} /> */}
		</>
	);
};
