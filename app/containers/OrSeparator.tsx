import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import I18n from '../i18n';
import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24
	},
	line: {
		height: 1,
		flex: 1
	},
	text: {
		fontSize: 14,
		marginLeft: 14,
		marginRight: 14,
		...sharedStyles.textMedium
	}
});

const OrSeparator = React.memo(({ theme }: {theme: TTheme}) => {
	const line = { backgroundColor: themes[theme].borderColor };
	const text = { color: themes[theme].auxiliaryText };
	return (
		<View style={styles.container}>
			<View style={[styles.line, line]} />
			<Text style={[styles.text, text]}>{I18n.t('OR')}</Text>
			<View style={[styles.line, line]} />
		</View>
	);
});

export default OrSeparator;
