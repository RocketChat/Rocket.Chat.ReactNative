import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useIsScreenReaderEnabled } from '../../../../lib/hooks/useIsScreenReaderEnabled';
import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import { isExternalKeyboardConnected } from '../../../../lib/methods/helpers/externalInput';
import { MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID } from '../../../../lib/constants/accessibility';
import InvertedScrollView from './InvertedScrollView';
import NavBottomFAB from './NavBottomFAB';
import FloatingDateSeparator from './FloatingDateSeparator';
import { type IListProps } from '../definitions';
import { HIDE_BUBBLE_DELAY, SCROLL_LIMIT } from '../constants';
import { useRoomContext } from '../../context';
import { useFloatingDate } from '../hooks/useFloatingDate';

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
	const { ts, viewabilityConfigCallbackPairs } = useFloatingDate();
	const bubbleOpacity = useSharedValue(0);
	const isBubbleFadingIn = useSharedValue(false);

	const hideBubble = (): void => {
		'worklet';

		bubbleOpacity.set(withDelay(HIDE_BUBBLE_DELAY, withTiming(0, { duration: 300 })));
	};

	const showBubble = (): void => {
		'worklet';

		if (isBubbleFadingIn.get()) {
			return;
		}
		if (bubbleOpacity.get() === 1) {
			hideBubble();
			return;
		}
		isBubbleFadingIn.set(true);
		bubbleOpacity.set(
			withTiming(1, { duration: 150 }, (): void => {
				isBubbleFadingIn.set(false);
				hideBubble();
			})
		);
	};

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			if (event.contentOffset.y > SCROLL_LIMIT) {
				scheduleOnRN(setScrolledPastLimit, true);
			} else {
				scheduleOnRN(setScrolledPastLimit, false);
			}
			showBubble();
		}
	});

	// Anchored window: loaded rows' bottom edge isn't the Live Tail, so force the FAB visible to keep a path back to live.
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
				initialNumToRender={20}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				scrollEventThrottle={16}
				onScroll={scrollHandler}
				{...props}
				{...scrollPersistTaps}
				viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
			/>
			<FloatingDateSeparator ts={ts} opacity={bubbleOpacity} />
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};

export default List;
