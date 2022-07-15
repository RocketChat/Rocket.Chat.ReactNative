import { Text } from 'react-native';
import React from 'react';
import { BottomSheetView, BottomSheetFlatList } from '@gorhom/bottom-sheet';

import { Button } from './Button';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { IActionSheetItem, Item } from './Item';
import { TActionSheetOptionsItem } from './Provider';
import styles from './styles';
import * as List from '../List';

interface IBottomSheetContentProps {
	hasCancel?: boolean;
	options?: TActionSheetOptionsItem[];
	hide: () => void;
	children?: React.ReactElement | null;
}

const BottomSheetContent = React.memo(({ options, hasCancel, hide, children }: IBottomSheetContentProps) => {
	const { theme, colors } = useTheme();

	const renderFooter = () =>
		hasCancel ? (
			<Button
				onPress={hide}
				style={[styles.button, { backgroundColor: colors.auxiliaryBackground }]}
				// TODO: Remove when migrate Touch
				theme={theme}
				accessibilityLabel={I18n.t('Cancel')}>
				<Text style={[styles.text, { color: colors.bodyText }]}>{I18n.t('Cancel')}</Text>
			</Button>
		) : null;

	const renderItem = ({ item }: { item: IActionSheetItem['item'] }) => <Item item={item} hide={hide} />;

	if (options) {
		return (
			<BottomSheetFlatList
				testID='action-sheet'
				data={options}
				refreshing={false}
				keyExtractor={item => item.title}
				bounces={true}
				renderItem={renderItem}
				style={{ backgroundColor: colors.focusedBackground }}
				keyboardDismissMode='interactive'
				indicatorStyle='black'
				contentContainerStyle={styles.content}
				ItemSeparatorComponent={List.Separator}
				ListHeaderComponent={List.Separator}
				ListFooterComponent={renderFooter}
			/>
		);
	}
	return <BottomSheetView style={styles.contentContainer}>{children}</BottomSheetView>;
});

export default BottomSheetContent;
