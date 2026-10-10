import { Fragment, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useActionSheet } from '~/containers/ActionSheet';
import * as List from '~/containers/List';
import { type TSubscriptionModel } from '~/definitions';
import I18n from '~/i18n';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { getRoomTitle } from '~/lib/methods/helpers';
import Navigation from '~/lib/navigation/appNavigation';
import { useTheme } from '~/theme';
import { toCategoryRoom } from '~/views/CreateCategoryView/hooks/useCategoryRoomCandidates';
import sharedStyles from '~/views/Styles';
import { useRoomCategory } from './hooks/useRoomCategory';

const styles = StyleSheet.create({
	container: {
		paddingTop: 16,
		gap: 28
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: 16,
		lineHeight: 22,
		textAlign: 'center'
	},
	description: {
		...sharedStyles.textRegular,
		fontSize: 14,
		lineHeight: 20,
		paddingHorizontal: 12
	}
});

interface IMoveToCategorySheet {
	room: TSubscriptionModel;
	category?: string;
	favorite?: boolean;
}

const MoveToCategorySheet = ({ room, category, favorite }: IMoveToCategorySheet): ReactElement => {
	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();
	const isMasterDetail = useMasterDetail();
	const { categoryOptions, currentCategoryId, moveToCategory } = useRoomCategory({ rid: room.rid, category, f: favorite });

	const selectCategory = (categoryId: string) => {
		hideActionSheet();
		moveToCategory(categoryId);
	};

	const createCategory = () => {
		hideActionSheet();
		const params = { screen: 'CreateCategoryView', params: { rooms: [toCategoryRoom(room)] } };
		Navigation.navigate(isMasterDetail ? 'ModalStackNavigator' : 'NewMessageStackNavigator', params);
	};

	return (
		<View style={styles.container} testID='move-to-category-sheet'>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('Move_to_category')}</Text>
			<Text style={[styles.description, { color: colors.fontSecondaryInfo }]}>
				{I18n.t('Select_category_to_move_room_to', { name: getRoomTitle(room) })}
			</Text>
			<View>
				{categoryOptions.map(option => (
					<Fragment key={option.id}>
						<List.Item
							title={option.name}
							translateTitle={false}
							onPress={() => selectCategory(option.id)}
							testID={`move-to-category-${option.id}`}
							left={() => (option.isFavorites ? <List.Icon name='star' /> : <List.Icon name='folder' />)}
							right={() => (
								<List.Checkbox value={option.id === currentCategoryId} onValueChange={() => selectCategory(option.id)} />
							)}
							additionalAccessibilityLabel={option.id === currentCategoryId}
							additionalAccessibilityLabelCheck
						/>
						<List.Separator />
					</Fragment>
				))}
				<List.Item
					title='New_category'
					onPress={createCategory}
					testID='move-to-category-new-category'
					left={() => <List.Icon name='folder-plus' />}
				/>
				<List.Separator />
			</View>
		</View>
	);
};

export default MoveToCategorySheet;
