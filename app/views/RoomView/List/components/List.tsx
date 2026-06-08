import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useIsScreenReaderEnabled } from '../../../../lib/hooks/useIsScreenReaderEnabled';
import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import { isExternalKeyboardConnected } from '../../../../lib/methods/helpers/externalInput';
import { MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID } from '../../../../lib/constants/accessibility';
import InvertedScrollView from './InvertedScrollView';
import NavBottomFAB from './NavBottomFAB';
import { type IListProps } from '../definitions';
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

const List = ({ listRef, jumpToBottom, isAnchored, ...props }: IListProps) => {
	const [scrolledPastLimit, setScrolledPastLimit] = useState(false);
	const { isAutocompleteVisible } = useRoomContext();
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			if (event.contentOffset.y > SCROLL_LIMIT) {
				scheduleOnRN(setScrolledPastLimit, true);
			} else {
				scheduleOnRN(setScrolledPastLimit, false);
			}
		}
	});

	// In a Live Window the FAB tracks scroll distance from the Live Tail. In an Anchored (historical)
	// Window the loaded rows' bottom edge is NOT the Live Tail, so offset alone would hide the FAB right
	// at the "Load newer" boundary — leaving no one-tap way back to live. Force it visible while anchored.
	const visible = scrolledPastLimit || !!isAnchored;

	const isScreenReaderEnabled = useIsScreenReaderEnabled();

	const renderScrollComponent = !isIOS && (isScreenReaderEnabled || isExternalKeyboardConnected());
	return (
		<View style={styles.list}>
			{/* @ts-ignore */}
			<Animated.FlatList
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				ref={listRef}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				inverted
				renderScrollComponent={
					renderScrollComponent
						? props => <InvertedScrollView {...props} exitFocusNativeId={MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID} />
						: undefined
				}
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
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};

export default List;
