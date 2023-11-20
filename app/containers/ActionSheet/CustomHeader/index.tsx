import React from 'react';
import { Text, StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';
import { useTheme } from '../../../theme';
import I18n from '../../../i18n';

const styles = StyleSheet.create({
	titleCustomHeader: {
		marginHorizontal: 16,
		marginBottom: 8,
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

export const NotPermissionHeader = () => {
	const { colors } = useTheme();

	return <Text style={[styles.titleCustomHeader, { color: colors.fontTitlesLabels }]}>{I18n.t('You_dont_have_permission')}</Text>;
};
