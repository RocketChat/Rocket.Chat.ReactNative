import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Tip from './Tip';
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

	return (
		<View>
			<Text style={[styles.PasswordTipsTitle, { color: colors.fontDefault }]}>You password must have:</Text>
			<View style={styles.tips}>
				<Tip type='success' description='At least 8 characters' />
				<Tip type='error' description='At most 24 characters' />
				<Tip description='Max. 2 repeating characters' />
				<Tip description='At least 1 lowercase letter' />
				<Tip description='At least 1 number' />
				<Tip description='At least 1 symbol' />
			</View>
		</View>
	);
};

export default PasswordTips;
