import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themes } from '../lib/constants';
import sharedStyles from '../views/Styles';
import { getReadableVersion } from '../lib/methods/helpers';
import I18n from '../i18n';
import { TSupportedThemes } from '../theme';

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 13
	},
	bold: {
		...sharedStyles.textSemibold
	}
});

const AppVersion = React.memo(({ theme }: { theme: TSupportedThemes }) => (
	<View style={styles.container}>
		<Text style={[styles.text, { color: themes[theme].fontSecondaryInfo }]}>
			{I18n.t('Version_no', { version: '' })}
			<Text style={styles.bold}>{getReadableVersion}</Text>
		</Text>
	</View>
));

export default AppVersion;
