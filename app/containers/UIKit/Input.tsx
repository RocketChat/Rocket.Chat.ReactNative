import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { IInput } from './interfaces';

const styles = StyleSheet.create({
	container: {
		marginBottom: 16
	},
	label: {
		fontSize: 14,
		marginVertical: 10,
		...sharedStyles.textSemibold
	},
	description: {
		marginBottom: 10,
		fontSize: 15,
		...sharedStyles.textRegular
	},
	error: {
		marginTop: 8,
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	hint: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

export const Input = ({ element, parser, label, description, error, hint, theme }: IInput) => (
	<View style={styles.container}>
		{label ? (
			<Text style={[styles.label, { color: error ? themes[theme].fontDanger : themes[theme].fontTitlesLabels }]}>{label}</Text>
		) : null}
		{description ? <Text style={[styles.description, { color: themes[theme].fontSecondaryInfo }]}>{description}</Text> : null}
		{parser.renderInputs({ ...element }, BlockContext.FORM, parser)}
		{error ? <Text style={[styles.error, { color: themes[theme].fontDanger }]}>{error}</Text> : null}
		{hint ? <Text style={[styles.hint, { color: themes[theme].fontSecondaryInfo }]}>{hint}</Text> : null}
	</View>
);
