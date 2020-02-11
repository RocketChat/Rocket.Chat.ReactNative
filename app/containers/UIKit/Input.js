import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';

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

export const Input = ({
	element, parser, label, description, error, hint, theme
}) => (
	<View style={styles.container}>
		{label ? <Text style={[styles.label, { color: error ? themes[theme].dangerColor : themes[theme].titleText }]}>{label}</Text> : null}
		{description ? <Text style={[styles.description, { color: themes[theme].auxiliaryText }]}>{description}</Text> : null}
		{parser.renderInputs({ ...element }, BLOCK_CONTEXT.FORM, parser)}
		{error ? <Text style={[styles.error, { color: themes[theme].dangerColor }]}>{error}</Text> : null}
		{hint ? <Text style={[styles.hint, { color: themes[theme].auxiliaryText }]}>{hint}</Text> : null}
	</View>
);

Input.propTypes = {
	element: PropTypes.object,
	parser: PropTypes.object,
	label: PropTypes.string,
	description: PropTypes.string,
	error: PropTypes.string,
	hint: PropTypes.string,
	theme: PropTypes.string
};
