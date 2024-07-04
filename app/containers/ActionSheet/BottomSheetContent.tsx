import { Text, ViewProps } from 'react-native';
import React from 'react';
import { BottomSheetView, BottomSheetFlatList } from '@discord/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { IActionSheetItem, Item } from './Item';
import { TActionSheetOptionsItem } from './Provider';
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
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	const renderFooter = () =>
		hasCancel ? (
			<Touch
				onPress={hide}
				style={[styles.button, { backgroundColor: colors.surfaceHover }]}
				accessibilityLabel={I18n.t('Cancel')}
			>
				<Text style={[styles.text, { color: colors.fontDefault }]}>{I18n.t('Cancel')}</Text>
			</Touch>
		) : null;

	const renderItem = ({ item }: { item: IActionSheetItem['item'] }) => <Item item={item} hide={hide} />;

	if (options) {
		return (
			<BottomSheetFlatList
				testID='action-sheet'
				data={options}
				refreshing={false}
				keyExtractor={item => item.title}
				bounces={false}
				renderItem={renderItem}
				style={{ backgroundColor: colors.strokeExtraDark }}
				keyboardDismissMode='interactive'
				indicatorStyle='black'
				contentContainerStyle={{ paddingBottom: bottom, backgroundColor: colors.surfaceLight }}
				ItemSeparatorComponent={List.Separator}
				ListHeaderComponent={List.Separator}
				ListFooterComponent={renderFooter}
				onLayout={onLayout}
			/>
		);
	}
	return (
		<BottomSheetView testID='action-sheet' style={styles.contentContainer} onLayout={onLayout}>
			{children}
		</BottomSheetView>
	);
});

export default BottomSheetContent;
