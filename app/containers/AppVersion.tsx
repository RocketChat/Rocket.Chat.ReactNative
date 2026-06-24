import { memo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../views/Styles';
import { getReadableVersion } from '../lib/methods/helpers';
import I18n from '../i18n';

const styles = StyleSheet.create(theme => ({
	container: {
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 13,
		color: theme.colors.fontSecondaryInfo
	},
	bold: {
		...sharedStyles.textSemibold
	}
}));

const AppVersion = memo(() => (
	<View style={styles.container}>
		<Text style={styles.text}>
			{I18n.t('Version_no', { version: '' })}
			<Text style={styles.bold}>{getReadableVersion}</Text>
		</Text>
	</View>
));

export default AppVersion;
