import React, { useMemo } from 'react';
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
	/* 	const [visible, setVisible] = useState(false);
	 */ const { isAutocompleteVisible } = useRoomContext();
	/* 
	const scrollHandler = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		if (e.nativeEvent.contentOffset.y > SCROLL_LIMIT) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}; */

	const maintainVisibleContentPositionConfig = useMemo(
		() => ({
			autoscrollToBottomThreshold: 0.1,
			startRenderingFromBottom: true
		}),
		[]
	);
	return (
		<View style={styles.list}>
			<FlashList
				ref={listRef}
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				scrollEventThrottle={16}
				keyboardShouldPersistTaps='handled'
				maintainVisibleContentPosition={maintainVisibleContentPositionConfig}
				{...props}
			/>
			{/* <NavBottomFAB visible={visible} onPress={jumpToBottom} />  */}
		</View>
	);
};
