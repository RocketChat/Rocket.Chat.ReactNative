import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Button from '~/containers/Button';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import RoomChip from '~/views/CreateCategoryView/components/RoomChip';
import TextWithBoldName from '~/views/CreateCategoryView/components/TextWithBoldName';
import { useRoomSelection } from '~/views/CreateCategoryView/hooks/useRoomSelection';
import { type ICategoryRoom } from '~/views/CreateCategoryView/types';
import { useCustomCategory } from './hooks/useCustomCategory';
import { useSaveCategoryRooms } from './hooks/useSaveCategoryRooms';

const styles = StyleSheet.create({
	content: {
		paddingTop: 16,
		paddingHorizontal: 12,
		gap: 12
	},
	caption: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	chips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8
	}
});

export type ConfirmCategoryRoomsViewParams = {
	categoryId: string;
	initialRoomIds: string[];
	rooms: ICategoryRoom[];
};

const ConfirmCategoryRoomsView = ({ route }: StaticScreenProps<ConfirmCategoryRoomsViewParams>) => {
	const { categoryId, initialRoomIds, rooms } = route.params;
	const { colors } = useTheme();
	const navigation = useNavigation();
	const category = useCustomCategory(categoryId);
	const { selectedRooms, toggleRoom } = useRoomSelection(rooms);
	const { saveRooms, saving } = useSaveCategoryRooms(categoryId, initialRoomIds);

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t('Manage_rooms') });
	}, [navigation]);

	return (
		<SafeAreaView testID='confirm-category-rooms-view' style={{ backgroundColor: colors.surfaceTint }}>
			<ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior={isIOS ? 'automatic' : undefined}>
				<TextWithBoldName
					translationKey='Category_name_label'
					name={category?.name ?? ''}
					style={[styles.caption, { color: colors.fontSecondaryInfo }]}
				/>
				{selectedRooms.length > 0 ? (
					<View style={styles.chips}>
						{selectedRooms.map(room => (
							<RoomChip key={room.rid} room={room} onRemove={toggleRoom} />
						))}
					</View>
				) : null}
				<Button
					title={I18n.t('Save')}
					onPress={() => saveRooms(selectedRooms.map(room => room.rid))}
					loading={saving}
					testID='confirm-category-rooms-view-save'
				/>
			</ScrollView>
		</SafeAreaView>
	);
};

export default ConfirmCategoryRoomsView;
