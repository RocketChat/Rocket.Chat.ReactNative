import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { LegendList } from '@legendapp/list';

import { IListProps } from '../definitions';
import { useRoomContext } from '../../context';
import NavBottomFAB from './NavBottomFAB';

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingVertical: 10
	}
});

export const List = ({ listRef, jumpToBottom, ...props }: IListProps) => {
	const { isAutocompleteVisible } = useRoomContext();
	const [visible, setVisible] = useState(false);

	// TO DO: find another way to follow like SCROLL_LIMIT
	const checkIfAtEnd = () => {
		if (listRef.current?.getState()?.isAtEnd) {
			setVisible(false);
		} else {
			setVisible(true);
		}
	};

	const { data } = props;
	const initialScrollIndex = (data?.length ?? 0) - 1;

	if (initialScrollIndex < 1) return null;

	return (
		<View style={styles.list}>
			<LegendList
				ref={listRef}
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				onEndReachedThreshold={0.5}
				onScroll={checkIfAtEnd}
				keyExtractor={item => item?.id}
				maintainScrollAtEndThreshold={0.1}
				initialScrollIndex={initialScrollIndex}
				maintainScrollAtEnd
				maintainVisibleContentPosition
				waitForInitialLayout
				recycleItems
				alignItemsAtEnd
				{...props}
			/>
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};
