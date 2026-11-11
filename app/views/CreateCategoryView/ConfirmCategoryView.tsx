import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import Button from '~/containers/Button';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
import CategoryNameField from './components/CategoryNameField';
import RoomChips from './components/RoomChips';
import { useCategoryDraftStore } from './hooks/useCategoryDraftStore';
import { useCategoryNameError } from './hooks/useCategoryName';
import { useCreateCategory } from './hooks/useCreateCategory';

const styles = StyleSheet.create({
	content: {
		paddingTop: 16,
		paddingHorizontal: 12,
		gap: 12
	},
	chips: {
		paddingBottom: 16
	}
});

export type ConfirmCategoryViewParams = undefined;

const ConfirmCategoryView = () => {
	const { colors } = useTheme();
	const navigation = useNavigation();
	const { createCategory, creating, categoryId } = useCreateCategory();
	const name = useCategoryDraftStore(state => state.name);
	const setName = useCategoryDraftStore(state => state.setName);
	const selectedRooms = useCategoryDraftStore(state => state.rooms);
	const toggleRoom = useCategoryDraftStore(state => state.toggleRoom);
	const { error, isValid } = useCategoryNameError(name, categoryId);

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t('Create_category') });
	}, [navigation]);

	return (
		<SafeAreaView testID='confirm-category-view' style={{ backgroundColor: colors.surfaceTint }}>
			<ScrollView
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior={isIOS ? 'automatic' : undefined}
				keyboardShouldPersistTaps='handled'>
				<CategoryNameField value={name} onChangeText={setName} error={error} />
				<RoomChips rooms={selectedRooms} onRemove={toggleRoom} style={styles.chips} />
				<Button
					title={I18n.t('Create')}
					onPress={() =>
						createCategory(
							name,
							selectedRooms.map(room => room.rid)
						)
					}
					disabled={!isValid}
					loading={creating}
					testID='confirm-category-view-create'
				/>
			</ScrollView>
		</SafeAreaView>
	);
};

export default ConfirmCategoryView;
