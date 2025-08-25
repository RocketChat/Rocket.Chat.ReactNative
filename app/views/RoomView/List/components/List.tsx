import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';
import { AnimatedLegendList } from '@legendapp/list/reanimated';

import NavBottomFAB from './NavBottomFAB';
import { IListProps } from '../definitions';
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

export const List = ({ listRef, jumpToBottom, ...props }: IListProps) => {
	const [visible, setVisible] = useState(false);
	const { isAutocompleteVisible } = useRoomContext();
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			if (event.contentOffset.y > SCROLL_LIMIT) {
				runOnJS(setVisible)(true);
			} else {
				runOnJS(setVisible)(false);
			}
		}
	});

	const data = [...(props?.data || [])].reverse();
	const index = data.length - 1;

	if (index < 1) return null;
	return (
		<View style={styles.list}>
			{/* @ts-ignore */}
			<AnimatedLegendList
				accessibilityElementsHidden={isAutocompleteVisible}
				importantForAccessibility={isAutocompleteVisible ? 'no-hide-descendants' : 'yes'}
				testID='room-view-messages'
				contentContainerStyle={styles.contentContainer}
				style={styles.list}
				onEndReachedThreshold={0.5}
				onScroll={scrollHandler}
				data={data}
				initialScrollIndex={index}
				maintainScrollAtEnd
				renderItem={props.renderItem}
				keyExtractor={item => item?.id}
				maintainVisibleContentPosition
				maintainScrollAtEndThreshold={0.1}
			/>
			<NavBottomFAB visible={visible} onPress={jumpToBottom} />
		</View>
	);
};
