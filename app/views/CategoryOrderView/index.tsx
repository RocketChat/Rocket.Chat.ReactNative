import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ROW_MARGIN_HORIZONTAL, ROW_PADDING_HORIZONTAL, ROW_RADIUS } from '~/containers/NativeListRow/constants';
import { useListBackgroundColor } from '~/containers/NativeListRow/hooks/useListBackgroundColor';
import SafeAreaView from '~/containers/SafeAreaView';
import i18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import CategoryOrderRow from './components/CategoryOrderRow';
import SortableList from './components/SortableList';
import { useCategoryOrder } from './hooks/useCategoryOrder';

const styles = StyleSheet.create({
	hint: {
		...sharedStyles.textRegular,
		fontSize: 13,
		lineHeight: 18,
		paddingHorizontal: ROW_MARGIN_HORIZONTAL + ROW_PADDING_HORIZONTAL,
		paddingTop: 16,
		paddingBottom: 8
	},
	card: {
		marginHorizontal: ROW_MARGIN_HORIZONTAL,
		borderRadius: ROW_RADIUS,
		overflow: 'hidden'
	}
});

const CategoryOrderView = () => {
	const navigation = useNavigation();
	const { colors } = useTheme();
	const backgroundColor = useListBackgroundColor(colors.surfaceRoom);
	const { movableGroups, pinnedGroup, saveOrder } = useCategoryOrder();

	useLayoutEffect(() => {
		navigation.setOptions({ title: i18n.t('Category_order') });
	}, [navigation]);

	return (
		<SafeAreaView testID='category-order-view' style={{ backgroundColor }}>
			<ScrollView contentInsetAdjustmentBehavior={isIOS ? 'automatic' : undefined}>
				<Text style={[styles.hint, { color: colors.fontSecondaryInfo }]}>{i18n.t('Drag_to_reorder')}</Text>
				<View style={styles.card}>
					<SortableList key={movableGroups.map(group => group.id).join()} groups={movableGroups} onReorder={saveOrder} />
					{pinnedGroup ? <CategoryOrderRow title={pinnedGroup.title} disabled /> : null}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default CategoryOrderView;
