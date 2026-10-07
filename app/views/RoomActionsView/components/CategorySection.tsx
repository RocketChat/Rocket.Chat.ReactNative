import { type ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useActionSheet } from '~/containers/ActionSheet';
import * as List from '~/containers/List';
import { asNativeListSection } from '~/containers/List/native/utils/rowMarkers';
import { type TSubscriptionModel } from '~/definitions';
import { useTheme } from '~/theme';
import { useHasCustomCategoriesLicense } from '~/views/RoomsListView/hooks/useSidebarCategories';
import sharedStyles from '~/views/Styles';
import { useRoomCategory } from '~/containers/MoveToCategorySheet/hooks/useRoomCategory';
import MoveToCategorySheet from '~/containers/MoveToCategorySheet';

const styles = StyleSheet.create({
	value: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

interface ICategorySection {
	room: TSubscriptionModel;
	category?: string;
	favorite?: boolean;
	joined: boolean;
}

function CategorySection({ room, category, favorite, joined }: ICategorySection): ReactElement | null {
	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();
	const hasCustomCategoriesLicense = useHasCustomCategoriesLicense();
	const { currentCategoryName } = useRoomCategory({ rid: room.rid, category, f: favorite });

	if (!hasCustomCategoriesLicense || !joined || room.t === 'l') {
		return null;
	}

	return (
		<List.Section>
			<List.Separator />
			<List.Item
				title='Category'
				onPress={() =>
					showActionSheet({
						children: <MoveToCategorySheet room={room} category={category} favorite={favorite} />,
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

export default asNativeListSection(CategorySection);
