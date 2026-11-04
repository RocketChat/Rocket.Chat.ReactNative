import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import Button from '~/containers/Button';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
import CategoryNameField from '~/views/CreateCategoryView/components/CategoryNameField';
import { useCategoryName } from '~/views/CreateCategoryView/hooks/useCategoryName';
import { useCustomCategory } from './hooks/useCustomCategory';
import { useRenameCategory } from './hooks/useRenameCategory';

const styles = StyleSheet.create({
	content: {
		paddingTop: 16,
		paddingHorizontal: 12,
		gap: 12
	}
});

export type RenameCategoryViewParams = {
	categoryId: string;
};

const RenameCategoryView = ({ route }: StaticScreenProps<RenameCategoryViewParams>) => {
	const { categoryId } = route.params;
	const { colors } = useTheme();
	const navigation = useNavigation();
	const currentName = useCustomCategory(categoryId)?.name ?? '';
	const { name, setName, error, isValid } = useCategoryName(currentName, categoryId);
	const { rename, saving } = useRenameCategory(categoryId);
	const canSave = isValid && name.trim() !== currentName;

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t('Rename') });
	}, [navigation]);

	return (
		<SafeAreaView testID='rename-category-view' style={{ backgroundColor: colors.surfaceTint }}>
			<ScrollView
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior={isIOS ? 'automatic' : undefined}
				keyboardShouldPersistTaps='handled'>
				<CategoryNameField
					value={name}
					onChangeText={setName}
					error={error}
					onSubmitEditing={() => canSave && rename(name)}
					autoFocus
				/>
				<Button
					title={I18n.t('Save')}
					onPress={() => rename(name)}
					disabled={!canSave}
					loading={saving}
					testID='rename-category-view-save'
				/>
			</ScrollView>
		</SafeAreaView>
	);
};

export default RenameCategoryView;
