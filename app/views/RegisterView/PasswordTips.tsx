import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Tip from './Tip';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	PasswordTipsTitle: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	},
	tips: {
		gap: 8,
		paddingTop: 8
	}
});

const PasswordTips = () => {
	const { colors } = useTheme();

	const accessibilityLabel = `${i18n.t('Your_Password_Must_Have')}  ${i18n.t('At_Least_8_Characters')} -  ${i18n.t(
		'At_Most_24_Characters'
	)} - ${i18n.t('Max_2_Repeating_Characters')} - ${i18n.t('At_Least_1_Lowercase_Letter')} - ${i18n.t(
		'At_Least_1_Number'
	)} - ${i18n.t('At_Least_1_Symbol')}`;
	return (
		<View accessible accessibilityLabel={accessibilityLabel}>
			<Text accessible style={[styles.PasswordTipsTitle, { color: colors.fontDefault }]}>
				{i18n.t('Your_Password_Must_Have')}
			</Text>
			<View style={styles.tips}>
				<Tip type='success' description={i18n.t('At_Least_8_Characters')} />
				<Tip type='error' description={i18n.t('At_Most_24_Characters')} />
				<Tip description={i18n.t('Max_2_Repeating_Characters')} />
				<Tip description={i18n.t('At_Least_1_Lowercase_Letter')} />
				<Tip description={i18n.t('At_Least_1_Number')} />
				<Tip description={i18n.t('At_Least_1_Symbol')} />
			</View>
		</View>
	);
};

export default PasswordTips;
