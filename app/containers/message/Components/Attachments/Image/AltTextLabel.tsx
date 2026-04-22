import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../../../../i18n';
import sharedStyles from '../../../../../views/Styles';
import { useTheme } from '../../../../../theme';

const styles = StyleSheet.create({
	container: {
		alignSelf: 'flex-start',
		paddingHorizontal: 4,
		borderRadius: 4,
		height: 20,
		position: 'absolute',
		bottom: 12,
		right: 12
	},
	label: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textBold
	}
});

const AltTextLabel = () => {
	'use memo';

	const { colors } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceNeutral }]}>
			<Text style={[styles.label, { color: colors.fontTitlesLabels }]}>{I18n.t('Alt')}</Text>
		</View>
	);
};

AltTextLabel.displayName = 'AltTextLabel';

export default AltTextLabel;
