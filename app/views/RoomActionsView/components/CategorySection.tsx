import { type ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useActionSheet } from '~/containers/ActionSheet';
import * as List from '~/containers/List';
import { type TSubscriptionModel } from '~/definitions';
import { useTheme } from '~/theme';
import { useIsCustomCategoriesAvailable } from '~/views/RoomsListView/hooks/useSidebarCategories';
import sharedStyles from '~/views/Styles';
import { useRoomCategory } from '~/containers/MoveToCategorySheet/hooks/useRoomCategory';
import { useRoomPlacement } from '~/containers/MoveToCategorySheet/hooks/useRoomPlacement';
import MoveToCategorySheet from '~/containers/MoveToCategorySheet';

const styles = StyleSheet.create({
	value: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

interface ICategorySection {
	room: TSubscriptionModel;
	joined: boolean;
}

function CategorySection({ room, joined }: ICategorySection): ReactElement | null {
	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();
	const isCustomCategoriesAvailable = useIsCustomCategoriesAvailable();
	const { currentCategoryName } = useRoomCategory(useRoomPlacement(room));

	if (!isCustomCategoriesAvailable || !joined || room.t === 'l') {
		return null;
	}

	return (
		<List.Section>
			<List.Separator />
			<List.Item
				title='Category'
				onPress={() =>
					showActionSheet({
						children: <MoveToCategorySheet room={room} />,
						fullContainer: true
					})
				}
				testID='room-actions-category'
				left={() => <List.Icon name='folder-star' />}
				right={
					currentCategoryName
						? () => <Text style={[styles.value, { color: colors.fontSecondaryInfo }]}>{`(${currentCategoryName})`}</Text>
						: undefined
				}
				additionalAccessibilityLabel={currentCategoryName}
				showActionIndicator
			/>
			<List.Separator />
		</List.Section>
	);
}

export default CategorySection;
