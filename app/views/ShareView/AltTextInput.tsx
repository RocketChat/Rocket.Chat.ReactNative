import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import I18n from '../../i18n';
import sharedStyles from '../Styles';
import { themes } from '../../lib/constants/colors';
import { type TSupportedThemes } from '../../theme';

interface IAltTextInput {
	value: string;
	onChangeText: (text: string) => void;
	theme: TSupportedThemes;
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

const AltTextInput = ({ value, onChangeText, theme }: IAltTextInput) => (
	<View testID='share-view-alt-text' style={[styles.container, { backgroundColor: themes[theme].surfaceHover }]}>
		<Text style={[styles.label, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('Alt_text')}</Text>
		<Text style={[styles.helper, { color: themes[theme].fontSecondaryInfo }]}>{I18n.t('Alt_text_description')}</Text>
		<TextInput
			value={value}
			onChangeText={onChangeText}
			placeholder={I18n.t('Alt_text_placeholder')}
			placeholderTextColor={themes[theme].fontSecondaryInfo}
			style={[
				styles.input,
				{ color: themes[theme].fontDefault, borderColor: themes[theme].strokeLight, backgroundColor: themes[theme].surfaceLight }
			]}
			returnKeyType='done'
			blurOnSubmit
		/>
	</View>
);

AltTextInput.displayName = 'AltTextInput';

export default AltTextInput;
