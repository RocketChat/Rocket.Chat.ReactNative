import React, { useEffect, useMemo, useRef } from 'react';
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
	const firstRender = useRef<boolean>(true);
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

	useEffect(() => {
		if ((props.data?.length || 0) > 0 && listRef?.current && firstRender.current) {
			// delay so items have been laid out
			setTimeout(() => {
				listRef.current.scrollToEnd({ animated: false });
				firstRender.current = false;
			}, 100);
		}
	}, [props.data?.length]);

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
				automaticallyAdjustContentInsets
				{...props}
			/>
			{/* <NavBottomFAB visible={visible} onPress={jumpToBottom} />  */}
		</View>
	);
};
