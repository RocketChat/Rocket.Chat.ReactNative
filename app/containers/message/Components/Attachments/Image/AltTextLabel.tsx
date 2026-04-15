import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../../../../i18n';
import sharedStyles from '../../../../../views/Styles';
import { useTheme } from '../../../../../theme';

const styles = StyleSheet.create({
	container: {
		alignSelf: 'flex-start',
		paddingHorizontal: 6,
		paddingVertical: 3,
		borderRadius: 4
	},
	label: {
		fontSize: 12,
		lineHeight: 16,
		...sharedStyles.textSemibold
	}
});

const AltTextLabel = () => {
	'use memo';

	const { colors } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceNeutral }]}>
			<Text style={[styles.label, { color: colors.fontTitlesLabels }]}>{I18n.t('Alt_text')}</Text>
		</View>
	);
};

AltTextLabel.displayName = 'AltTextLabel';

export default AltTextLabel;
