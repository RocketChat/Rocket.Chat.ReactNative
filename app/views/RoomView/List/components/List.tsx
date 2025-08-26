import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { IListProps } from '../definitions';
import { useRoomContext } from '../../context';
import NavBottomFAB from './NavBottomFAB';
import { SCROLL_LIMIT } from '../constants';

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

export const List = ({ listRef, jumpToBottom, ...props }: IListProps) => {
	const [visible, setVisible] = useState(false);
	const { isAutocompleteVisible } = useRoomContext();

	const initialScrollIndex = (props.data?.length || 0) - 1;

	const scrollHandler = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		if (e.nativeEvent.contentOffset.y > SCROLL_LIMIT) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	};

	if (initialScrollIndex < 1) return null;

	return (
		<View style={styles.list}>
			<FlashList
				ref={listRef}
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				initialScrollIndex={initialScrollIndex}
				keyboardShouldPersistTaps='handled'
				{...props}
				maintainVisibleContentPosition={{
					animateAutoScrollToBottom: true,
					autoscrollToBottomThreshold: 0.1,
					startRenderingFromBottom: true
				}}
			/>
			<NavBottomFAB visible={visible} onPress={jumpToBottom} /> *
		</View>
	);
};
