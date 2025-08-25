import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { IListProps } from '../definitions';
import { useRoomContext } from '../../context';

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

export const List = ({ listRef, jumpToBottom, ...props }: IListProps) => {
	const { isAutocompleteVisible } = useRoomContext();

	/* const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			if (event.contentOffset.y > SCROLL_LIMIT) {
				runOnJS(setVisible)(true);
			} else {
				runOnJS(setVisible)(false);
			}
		}
	}); */

	return (
		<View style={styles.list}>
			<FlashList
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				scrollEventThrottle={16}
				initialScrollIndex={props?.data?.length - 1}
				maintainVisibleContentPosition={{
					animateAutoScrollToBottom: true,
					autoscrollToBottomThreshold: 0,
					startRenderingFromBottom: true
				}}
				keyboardShouldPersistTaps='handled'
				{...props}
			/>
			{/* <NavBottomFAB visible={visible} onPress={jumpToBottom} /> */}
		</View>
	);
};
