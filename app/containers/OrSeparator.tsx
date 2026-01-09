import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../i18n';
import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';
import { useResponsiveLayout } from '../lib/hooks/useResponsiveLayout/useResponsiveLayout';

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
		marginHorizontal: 12,
		...sharedStyles.textMedium
	}
});

const OrSeparator = React.memo(() => {
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	const line = { backgroundColor: colors.strokeLight };
	const text = { color: colors.fontSecondaryInfo };

	return (
		<View accessible style={styles.container}>
			<View style={[styles.line, line]} />
			<Text style={[styles.text, text, { fontSize: scaleFontSize(16) }]}>{I18n.t('OR')}</Text>
			<View style={[styles.line, line]} />
		</View>
	);
});

export default OrSeparator;
