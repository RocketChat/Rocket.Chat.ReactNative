import { StyleSheet, Text, View } from 'react-native';
import { memo } from 'react';

import I18n from '../i18n';
import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';

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
		fontSize: 16,
		marginHorizontal: 12,
		...sharedStyles.textMedium
	}
});

const OrSeparator = memo(() => {
	const { colors } = useTheme();
	const line = { backgroundColor: colors.strokeLight };
	const text = { color: colors.fontSecondaryInfo };

	return (
		<View accessible style={styles.container}>
			<View style={[styles.line, line]} />
			<Text style={[styles.text, text]}>{I18n.t('OR')}</Text>
			<View style={[styles.line, line]} />
		</View>
	);
});

export default OrSeparator;
