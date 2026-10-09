import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import Button from '~/containers/Button';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
import CategoryNameField from './components/CategoryNameField';
import RoomChips from './components/RoomChips';
import { useCategoryName } from './hooks/useCategoryName';
import { useCreateCategory } from './hooks/useCreateCategory';
import { useRoomSelection } from './hooks/useRoomSelection';
import { type ICategoryRoom } from './types';

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

export type ConfirmCategoryViewParams = {
	name: string;
	rooms: ICategoryRoom[];
};

const ConfirmCategoryView = ({ route }: StaticScreenProps<ConfirmCategoryViewParams>) => {
	const { colors } = useTheme();
	const navigation = useNavigation();
	const { name, setName, error, isValid } = useCategoryName(route.params.name);
	const { selectedRooms, toggleRoom } = useRoomSelection(route.params.rooms);
	const { createCategory, creating } = useCreateCategory();

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
