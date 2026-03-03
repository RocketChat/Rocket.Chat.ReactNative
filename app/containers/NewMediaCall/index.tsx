import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { FormTextInput } from '../TextInput';
import Button from '../Button';
import sharedStyles from '../../views/Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24
	},
	title: {
		fontSize: 20,
		lineHeight: 28,
		...sharedStyles.textBold
	},
	inputLabel: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 16,
		...sharedStyles.textRegular
	},
	inputContainer: {
		marginTop: 28,
		marginBottom: 8
	}
});

export const NewMediaCall = (): React.ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={styles.container}>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('New_call')}</Text>

			<FormTextInput
				containerStyle={styles.inputContainer}
				iconRight='search'
				bottomSheet
				showErrorMessage={false}
				testID='new-media-call-search-input'
			/>
			<Text style={[styles.inputLabel, { color: colors.fontDefault }]}>{I18n.t('Enter_username_or_number')}</Text>

			<Button
				title={I18n.t('Call')}
				onPress={() => {}}
				backgroundColor={colors.buttonBackgroundSuccessDefault}
				color={colors.buttonFontPrimary}
				testID='new-media-call-button'
			/>
		</View>
	);
};

export default NewMediaCall;
