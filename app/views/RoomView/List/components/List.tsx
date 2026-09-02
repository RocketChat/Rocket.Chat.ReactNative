import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useIsScreenReaderEnabled } from '../../../../lib/hooks/useIsScreenReaderEnabled';
import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import { isExternalKeyboardConnected } from '../../../../lib/methods/helpers/externalInput';
import { MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID } from '../../../../lib/constants/accessibility';
import InvertedScrollView from './InvertedScrollView';
import NavBottomFAB from './NavBottomFAB';
import { type TAnyMessageModel } from '../../../../definitions';
import { type IListProps } from '../../definitions';
import { SCROLL_LIMIT } from '../constants';
import { useIsAutocompleteVisible } from '../../../../containers/MessageComposer/store';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<TAnyMessageModel>);

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	}
});

const List = ({ flatListRef, jumpToBottom, isAnchored, ...props }: IListProps) => {
	const [scrolledPastLimit, setScrolledPastLimit] = useState(false);
	const isAutocompleteVisible = useIsAutocompleteVisible();
	const wasScrolledPastLimit = useSharedValue(false);
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			const isPastLimit = event.contentOffset.y > SCROLL_LIMIT;
			if (isPastLimit !== wasScrolledPastLimit.value) {
				wasScrolledPastLimit.value = isPastLimit;
				scheduleOnRN(setScrolledPastLimit, isPastLimit);
			}
		}
	});

	// Anchored window: loaded rows' bottom edge isn't the Live Tail, so force the FAB visible to keep a path back to live.
	const visible = scrolledPastLimit || !!isAnchored;

	const isScreenReaderEnabled = useIsScreenReaderEnabled();

	const renderScrollComponent = !isIOS && (isScreenReaderEnabled || isExternalKeyboardConnected());
	return (
		<View style={styles.list}>
			<AnimatedFlatList
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				ref={flatListRef}
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
			/>
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};

export default List;
