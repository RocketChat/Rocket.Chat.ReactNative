import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import Button from '~/containers/Button';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers/deviceInfo';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import RoomChips from '~/views/CreateCategoryView/components/RoomChips';
import TextWithBoldName from '~/views/CreateCategoryView/components/TextWithBoldName';
import { useCategoryDraftStore } from '~/views/CreateCategoryView/hooks/useCategoryDraftStore';
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
	}
});

export type ConfirmCategoryRoomsViewParams = {
	categoryId: string;
	initialRoomIds: string[];
};

const ConfirmCategoryRoomsView = ({ route }: StaticScreenProps<ConfirmCategoryRoomsViewParams>) => {
	const { categoryId, initialRoomIds } = route.params;
	const { colors } = useTheme();
	const navigation = useNavigation();
	const category = useCustomCategory(categoryId);
	const selectedRooms = useCategoryDraftStore(state => state.rooms);
	const toggleRoom = useCategoryDraftStore(state => state.toggleRoom);
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
				<RoomChips rooms={selectedRooms} onRemove={toggleRoom} />
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
