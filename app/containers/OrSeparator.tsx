import { memo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import I18n from '../i18n';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create(theme => ({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24
	},
	line: {
		height: 1,
		flex: 1,
		backgroundColor: theme.colors.strokeLight
	},
	text: {
		fontSize: 16,
		marginHorizontal: 12,
		...sharedStyles.textMedium,
		color: theme.colors.fontSecondaryInfo
	}
}));

const OrSeparator = memo(() => (
	<View accessible style={styles.container}>
		<View style={styles.line} />
		<Text style={styles.text}>{I18n.t('OR')}</Text>
		<View style={styles.line} />
	</View>
));

export default OrSeparator;
