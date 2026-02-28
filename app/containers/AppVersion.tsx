import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import sharedStyles from '../views/Styles';
import { getReadableVersion } from '../lib/methods/helpers';
import I18n from '../i18n';
import { useTheme } from '../theme';
import { useResponsiveLayout } from '../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	text: {
		...sharedStyles.textRegular
	},
	bold: {
		...sharedStyles.textSemibold
	}
});

const AppVersion = React.memo(() => {
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	return (
		<View style={styles.container}>
			<Text style={[styles.text, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(13) }]}>
				{I18n.t('Version_no', { version: '' })}
				<Text style={styles.bold}>{getReadableVersion}</Text>
			</Text>
		</View>
	);
});

export default AppVersion;
