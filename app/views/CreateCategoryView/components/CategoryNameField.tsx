import { StyleSheet, Text, View } from 'react-native';

import { FormTextInput } from '~/containers/TextInput';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	container: {
		gap: 4
	},
	input: {
		marginBottom: 0
	},
	hint: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	}
});

interface ICategoryNameField {
	value: string;
	onChangeText: (name: string) => void;
	error?: string;
	hint?: string;
	autoFocus?: boolean;
	onSubmitEditing?: () => void;
}

const CategoryNameField = ({ value, onChangeText, error, hint, autoFocus, onSubmitEditing }: ICategoryNameField) => {
	const { colors } = useTheme();

	return (
		<View style={styles.container}>
			<FormTextInput
				label={I18n.t('Name')}
				required
				value={value}
				onChangeText={onChangeText}
				error={error}
				autoFocus={autoFocus}
				onSubmitEditing={onSubmitEditing}
				returnKeyType='next'
				containerStyle={styles.input}
				testID='create-category-name'
			/>
			{hint && !error ? <Text style={[styles.hint, { color: colors.fontSecondaryInfo }]}>{hint}</Text> : null}
		</View>
	);
};

export default CategoryNameField;
