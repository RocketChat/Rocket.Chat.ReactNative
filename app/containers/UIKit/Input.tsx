import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { IInput } from './interfaces';
import { fontSize } from '../../lib/theme';

const styles = StyleSheet.create({
	container: {
		marginBottom: 16
	},
	label: {
		fontSize: fontSize[14],
		marginVertical: 10,
		...sharedStyles.textMedium
	},
	description: {
		marginBottom: 10,
		fontSize: fontSize[14],
		...sharedStyles.textRegular
	},
	error: {
		marginTop: 8,
		fontSize: fontSize[14],
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	hint: {
		fontSize: fontSize[14],
		...sharedStyles.textRegular
	}
});

export const Input = ({ element, parser, label, description, error, hint, theme }: IInput) => (
	<View style={styles.container}>
		{label ? (
			<Text style={[styles.label, { color: error ? themes[theme].dangerColor : themes[theme].titleText }]}>{label}</Text>
		) : null}
		{description ? <Text style={[styles.description, { color: themes[theme].auxiliaryText }]}>{description}</Text> : null}
		{parser.renderInputs({ ...element }, BlockContext.FORM, parser)}
		{error ? <Text style={[styles.error, { color: themes[theme].dangerColor }]}>{error}</Text> : null}
		{hint ? <Text style={[styles.hint, { color: themes[theme].auxiliaryText }]}>{hint}</Text> : null}
	</View>
);
