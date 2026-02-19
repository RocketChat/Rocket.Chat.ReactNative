import { FlatList, Text, useWindowDimensions, View, type ViewProps } from 'react-native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { isAndroid } from '../../lib/methods/helpers';
import { type IActionSheetItem, Item } from './Item';
import { type TActionSheetOptionsItem } from './Provider';
import styles from './styles';
import * as List from '../List';
import Touch from '../Touch';

interface IBottomSheetContentProps {
	hasCancel?: boolean;
	options?: TActionSheetOptionsItem[];
	hide: () => void;
	children?: React.ReactElement | null;
	onLayout: ViewProps['onLayout'];
}

const BottomSheetContent = React.memo(({ options, hasCancel, hide, children, onLayout }: IBottomSheetContentProps) => {
	'use memo';

	const { colors } = useTheme();
	const { fontScale, height: windowHeight } = useWindowDimensions();
	const height = 48 * fontScale;
	const paddingBottom = windowHeight * 0.05;

	const renderFooter = () =>
		hasCancel ? (
			<Touch
				onPress={hide}
				style={[styles.button, { backgroundColor: colors.surfaceHover, height }]}
				accessibilityLabel={I18n.t('Cancel')}>
				<Text style={[styles.text, { color: colors.fontDefault }]}>{I18n.t('Cancel')}</Text>
			</Touch>
		) : null;

	const renderItem = ({ item }: { item: IActionSheetItem['item'] }) => <Item item={item} hide={hide} />;

	if (options) {
		return (
			<GestureHandlerRootView style={styles.contentContainer}>
				<FlatList
					testID='action-sheet'
					data={options}
					refreshing={false}
					keyExtractor={item => item.title}
					bounces={false}
					renderItem={renderItem}
					style={{ backgroundColor: colors.surfaceLight }}
					keyboardDismissMode='interactive'
					indicatorStyle='black'
					contentContainerStyle={{ paddingBottom, backgroundColor: colors.surfaceLight }}
					ItemSeparatorComponent={List.Separator}
					ListHeaderComponent={List.Separator}
					ListFooterComponent={renderFooter}
					onLayout={onLayout}
					nestedScrollEnabled={isAndroid}
				/>
			</GestureHandlerRootView>
		);
	}
	return (
		<GestureHandlerRootView style={styles.contentContainer} testID='action-sheet'>
			<View onLayout={onLayout} style={{ flex: 1 }}>
				{children}
			</View>
		</GestureHandlerRootView>
	);
});

export default BottomSheetContent;
