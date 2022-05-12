import { Text } from 'react-native';
import React from 'react';
import { BottomSheetView, BottomSheetFlatList } from '@gorhom/bottom-sheet';

import { Button } from './Button';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { IActionSheetItem, Item } from './Item';
import { TActionSheetOptions } from './Provider';
import styles from './styles';
import * as List from '../List';

interface BottomSheetContentProps {
	type: string;
	data: TActionSheetOptions;
	hide: () => void;
	children?: React.ReactElement | null;
}

const BottomSheetContent = React.memo(({ type, data, hide, children }: BottomSheetContentProps) => {
	const { theme, colors } = useTheme();

	const renderFooter = () =>
		data?.hasCancel ? (
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

	if (type === 'FlatList') {
		return (
			<BottomSheetFlatList
				data={data.options}
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
	return <BottomSheetView>{children}</BottomSheetView>;
});

export default BottomSheetContent;
