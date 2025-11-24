import React, { useEffect, useMemo, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { type IListProps } from '../definitions';
import NavBottomFAB from './NavBottomFAB';
import { SCROLL_LIMIT } from '../constants';
import { useRoomContext } from '../../context';

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

const List = ({ listRef, jumpToBottom, ...props }: IListProps) => {
	const [visible, setVisible] = useState(false);
	const [userScrolled, setUserScrolled] = useState(false);
	const { isAutocompleteVisible } = useRoomContext();

	const maintainVisibleContentPositionConfig = useMemo(
		() => ({
			autoscrollToBottomThreshold: 0.05,
			startRenderingFromBottom: true,
			animateAutoScrollToBottom: true
		}),
		[]
	);

	const onScrollHandler = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const currentScroll = Math.round(e.nativeEvent?.contentSize?.height) - Math.round(e.nativeEvent?.contentOffset.y);
		const layoutLimit = e.nativeEvent.layoutMeasurement.height + SCROLL_LIMIT;

		if (layoutLimit < currentScroll) {
			setVisible(true);
		} else {
			setVisible(false);
			setUserScrolled(false);
		}
	};

	return (
		<View style={styles.list}>
			<FlashList
				ref={listRef}
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				onScroll={onScrollHandler}
				scrollEventThrottle={16}
				keyboardShouldPersistTaps='handled'
				maintainVisibleContentPosition={maintainVisibleContentPositionConfig}
				{...props}
			/>
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};

export default List;
