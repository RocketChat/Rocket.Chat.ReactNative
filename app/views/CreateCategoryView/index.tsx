import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers';
import { headerRightActions } from '~/lib/methods/helpers/navigation/headerActions';
import { type NewMessageStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import CategoryNameField from './components/CategoryNameField';
import { useCategoryName } from './hooks/useCategoryName';

const styles = StyleSheet.create({
	content: {
		paddingTop: 16,
		paddingHorizontal: 12
	}
});

const CreateCategoryView = () => {
	const { colors } = useTheme();
	const navigation = useNavigation<NativeStackNavigationProp<NewMessageStackParamList, 'CreateCategoryView'>>();
	const { name, setName, error, isValid } = useCategoryName();

	const goToRooms = () => {
		if (isValid) {
			navigation.navigate('CategoryRoomsView', { name: name.trim() });
		}
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Create_category'),
			...headerRightActions([
				{
					label: I18n.t('Next'),
					testID: 'create-category-view-next',
					disabled: !isValid,
					onPress: () => navigation.navigate('CategoryRoomsView', { name: name.trim() })
				}
			])
		});
	}, [navigation, name, isValid]);

	return (
		<SafeAreaView testID='create-category-view' style={{ backgroundColor: colors.surfaceTint }}>
			<ScrollView
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior={isIOS ? 'automatic' : undefined}
				keyboardShouldPersistTaps='handled'>
				<CategoryNameField
					value={name}
					onChangeText={setName}
					error={error}
					hint={I18n.t('Categories_are_private_custom_groupings_of_rooms')}
					onSubmitEditing={goToRooms}
					autoFocus
				/>
			</ScrollView>
		</SafeAreaView>
	);
};

export default CreateCategoryView;
