import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import I18n from '../../i18n';
import sharedStyles from '../Styles';
import { useTheme } from '../../theme';

interface IAltTextInput {
	value: string;
	onChangeText: (text: string) => void;
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 4,
		padding: 12,
		gap: 6
	},
	label: {
		fontSize: 14,
		lineHeight: 18,
		...sharedStyles.textSemibold
	},
	helper: {
		fontSize: 13,
		lineHeight: 18,
		...sharedStyles.textRegular
	},
	input: {
		fontSize: 14,
		lineHeight: 18,
		borderRadius: 4,
		borderWidth: 1,
		paddingHorizontal: 10,
		paddingVertical: 8,
		...sharedStyles.textRegular
	}
});

const AltTextInput = ({ value, onChangeText }: IAltTextInput) => {
	const { colors } = useTheme();
	return (
		<View testID='share-view-alt-text' style={[styles.container, { backgroundColor: colors.surfaceHover }]}>
			<Text style={[styles.label, { color: colors.fontTitlesLabels }]}>{I18n.t('Alt_text')}</Text>
			<Text style={[styles.helper, { color: colors.fontSecondaryInfo }]}>{I18n.t('Alt_text_description')}</Text>
			<TextInput
				accessibilityLabel={I18n.t('Alt_text')}
				value={value}
				onChangeText={onChangeText}
				placeholder={I18n.t('Alt_text_placeholder')}
				placeholderTextColor={colors.fontSecondaryInfo}
				style={[
					styles.input,
					{ color: colors.fontDefault, borderColor: colors.strokeLight, backgroundColor: colors.surfaceLight }
				]}
				returnKeyType='done'
				blurOnSubmit
			/>
		</View>
	);
};

AltTextInput.displayName = 'AltTextInput';

export default AltTextInput;
