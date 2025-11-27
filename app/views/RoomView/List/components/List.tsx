import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LegendList } from '@legendapp/list';

import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import NavBottomFAB from './NavBottomFAB';
import { type IListProps } from '../definitions';
import { SCROLL_LIMIT } from '../constants';
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


const List = ({ listRef, jumpToBottom, ...props }: IListProps) => {
	const { data } = props;
	const showScrollToBottomButton = (data?.length || 0) > 5;
	const [visible, setVisible] = useState(false);
	const { isAutocompleteVisible } = useRoomContext();
	const [visible, setVisible] = useState(false);

	const checkIfAtEnd = () => {
		if (listRef.current?.getState().isAtEnd) {
			setVisible(false);
		} else {
			setVisible(true);
		}
	};

	useEffect(() => {
		listRef?.current?.scrollToEnd();
	}, [props.data?.length]);

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
				maintainScrollAtEnd
				maintainVisibleContentPosition
				waitForInitialLayout
				recycleItems
				alignItemsAtEnd
				{...props}
			/>
			{showScrollToBottomButton ? <NavBottomFAB visible={visible} onPress={jumpToBottom} /> : null}
		</View>
	);
};

export default List;
