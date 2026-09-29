import { type Ref, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps, StyleSheet, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';

import { useIsScreenReaderEnabled } from '~/lib/hooks/useIsScreenReaderEnabled';
import { isIOS } from '~/lib/methods/helpers';
import scrollPersistTaps from '~/lib/methods/helpers/scrollPersistTaps';
import { isExternalKeyboardConnected } from '~/lib/methods/helpers/externalInput';
import { MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID } from '~/lib/constants/accessibility';
import VisualOrderScrollView from './VisualOrderScrollView';
import NavBottomFAB from './NavBottomFAB';
import { type TAnyMessageModel } from '~/definitions';
import { type IListProps } from '~/views/RoomView/definitions';
import { SCROLL_LIMIT } from '../constants';
import { useIsAutocompleteVisible } from '~/containers/MessageComposer/ComposerStore';
import FloatingDateSeparator from '~/containers/Separator/FloatingDateSeparator';
import { useFloatingDate } from '../hooks/useFloatingDate';

type TScrollComponentProps = ScrollViewProps & { ref?: Ref<VisualOrderScrollView> };

const styles = StyleSheet.create({
	list: {
		flex: 1
	},
	contentContainer: {
		paddingBottom: 10
	}
});

const ESTIMATED_MESSAGE_HEIGHT = 60;

const distanceFromEnd = ({ contentOffset, contentSize, layoutMeasurement }: NativeScrollEvent) =>
	contentSize.height - layoutMeasurement.height - contentOffset.y;

const List = ({ listRef, jumpToBottom, isAnchored, data, extraData, renderItem, onStartReached }: IListProps) => {
	const [scrolledPastLimit, setScrolledPastLimit] = useState(false);
	const isAutocompleteVisible = useIsAutocompleteVisible();
	const {
		ts,
		opacity: floatingDateOpacity,
		scrollEvents: { onBeginDrag, onMomentumBegin, onEndDrag, onMomentumEnd },
		viewabilityConfigCallbackPairs
	} = useFloatingDate();

	const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		setScrolledPastLimit(distanceFromEnd(event.nativeEvent) > SCROLL_LIMIT);
	};

	// Anchored window: loaded rows' bottom edge isn't the Live Tail, so force the FAB visible to keep a path back to live.
	const visible = scrolledPastLimit || !!isAnchored;

	const isScreenReaderEnabled = useIsScreenReaderEnabled();

	const renderScrollComponent = !isIOS && (isScreenReaderEnabled || isExternalKeyboardConnected());

	return (
		<View style={styles.list}>
			<LegendList<TAnyMessageModel>
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				ref={listRef}
				data={data}
				extraData={extraData}
				renderItem={renderItem}
				keyExtractor={item => item.id}
				estimatedItemSize={ESTIMATED_MESSAGE_HEIGHT}
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				renderScrollComponent={
					renderScrollComponent
						? (scrollProps: TScrollComponentProps) => (
								<VisualOrderScrollView
									ref={scrollProps.ref}
									horizontal={scrollProps.horizontal}
									style={scrollProps.style}
									contentContainerStyle={scrollProps.contentContainerStyle}
									contentOffset={scrollProps.contentOffset}
									maintainVisibleContentPosition={scrollProps.maintainVisibleContentPosition}
									scrollEnabled={scrollProps.scrollEnabled}
									showsVerticalScrollIndicator={scrollProps.showsVerticalScrollIndicator}
									scrollEventThrottle={scrollProps.scrollEventThrottle}
									removeClippedSubviews={scrollProps.removeClippedSubviews}
									testID={scrollProps.testID}
									accessibilityElementsHidden={scrollProps.accessibilityElementsHidden}
									importantForAccessibility={scrollProps.importantForAccessibility}
									keyboardShouldPersistTaps={scrollProps.keyboardShouldPersistTaps}
									keyboardDismissMode={scrollProps.keyboardDismissMode}
									onLayout={scrollProps.onLayout}
									onContentSizeChange={scrollProps.onContentSizeChange}
									onScroll={scrollProps.onScroll}
									onScrollBeginDrag={scrollProps.onScrollBeginDrag}
									onScrollEndDrag={scrollProps.onScrollEndDrag}
									onMomentumScrollBegin={scrollProps.onMomentumScrollBegin}
									onMomentumScrollEnd={scrollProps.onMomentumScrollEnd}
									exitFocusNativeId={MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID}>
									{scrollProps.children}
								</VisualOrderScrollView>
							)
						: undefined
				}
				alignItemsAtEnd
				initialScrollAtEnd
				maintainScrollAtEnd
				maintainVisibleContentPosition
				onStartReached={onStartReached}
				onStartReachedThreshold={0.5}
				scrollEventThrottle={16}
				onScroll={onScroll}
				onScrollBeginDrag={onBeginDrag}
				onMomentumScrollBegin={onMomentumBegin}
				onScrollEndDrag={onEndDrag}
				onMomentumScrollEnd={onMomentumEnd}
				keyboardShouldPersistTaps={scrollPersistTaps.keyboardShouldPersistTaps}
				keyboardDismissMode={scrollPersistTaps.keyboardDismissMode}
				viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
			/>
			<FloatingDateSeparator ts={ts} opacity={floatingDateOpacity} />
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};

export default List;
