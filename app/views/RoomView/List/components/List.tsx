import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useIsScreenReaderEnabled } from '../../../../lib/hooks/useIsScreenReaderEnabled';
import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import { isExternalKeyboardConnected } from '../../../../lib/methods/helpers/externalInput';
import { MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID } from '../../../../lib/constants/accessibility';
import InvertedScrollView from './InvertedScrollView';
import NavBottomFAB from './NavBottomFAB';
import FloatingDateSeparator from '../../../../containers/Separator/FloatingDateSeparator';
import { type IListProps } from '../definitions';
import { SCROLL_LIMIT } from '../constants';
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
	const { ts, opacity: floatingDateOpacity, show: showFloatingDate, viewabilityConfigCallbackPairs } = useFloatingDate();

	// onScroll also fires for programmatic scrolls (jump to bottom/message) and maintainVisibleContentPosition
	// autoscroll at the live tail, so the floating date only shows while the user is dragging or flinging.
	const isUserScrolling = useSharedValue(false);

	const scrollHandler = useAnimatedScrollHandler({
		onBeginDrag: () => {
			isUserScrolling.set(true);
		},
		onMomentumBegin: () => {
			isUserScrolling.set(true);
		},
		onScroll: event => {
			if (event.contentOffset.y > SCROLL_LIMIT) {
				scheduleOnRN(setScrolledPastLimit, true);
			} else {
				scheduleOnRN(setScrolledPastLimit, false);
			}
			if (isUserScrolling.get()) {
				showFloatingDate();
			}
		},
		// a drag released at near-zero velocity emits no momentum events, so onEndDrag must also clear the flag
		onEndDrag: () => {
			isUserScrolling.set(false);
		},
		onMomentumEnd: () => {
			isUserScrolling.set(false);
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
			<FloatingDateSeparator ts={ts} opacity={floatingDateOpacity} />
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};

export default List;
