import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';

import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
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

const List = ({ listRef, jumpToBottom, ...props }: IListProps) => {
	const [visible, setVisible] = useState(false);
	const { isAutocompleteVisible } = useRoomContext();
	const { data, renderItem, ...flatListProps } = props;

	const renderItemWithFocus: IListProps['renderItem'] = info => {
		if (!renderItem) {
			return null as any;
		}

		if (Platform.OS !== 'android') {
			return renderItem(info);
		}

		const total = data?.length ?? 0;
		const { index } = info;
		const itemId = `room-message-${index}`;

		const nextFocusUp = index < total - 1 ? `room-message-${index + 1}` : undefined;
		const nextFocusDown = index > 0 ? `room-message-${index - 1}` : undefined;

		return (
			<View
				nativeID={itemId}
				focusable
				{...(Platform.OS === 'android'
					? {
							// @ts-ignore Android-only props not in ViewProps types
							nextFocusUp,
							// @ts-ignore Android-only props not in ViewProps types
							nextFocusDown
					  }
					: null)}>
				{renderItem(info)}
			</View>
		);
	};

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			if (event.contentOffset.y > SCROLL_LIMIT) {
				runOnJS(setVisible)(true);
			} else {
				runOnJS(setVisible)(false);
			}
		}
	});

	return (
		<View style={styles.list}>
			{/* @ts-ignore */}
			<Animated.FlatList
				{...flatListProps}
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				ref={listRef}
				keyExtractor={item => item.id}
				data={data}
				renderItem={renderItemWithFocus}
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				inverted={props.inverted || true}
				renderScrollComponent={isIOS ? undefined : scrollProps => <InvertedScrollView {...scrollProps} />}
				removeClippedSubviews={isIOS}
				initialNumToRender={7}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				scrollEventThrottle={16}
				onScroll={scrollHandler}
				{...scrollPersistTaps}
			/>
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};

export default List;
