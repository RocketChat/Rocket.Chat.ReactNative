import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IPasswordPolicy } from '../../lib/hooks/useVerifyPassword';
import Tip from './Tip';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	passwordPoliciesTitle: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	},
	policies: {
		gap: 8,
		paddingTop: 8
	}
});

interface IPasswordTips {
	isDirty: boolean;
	password: string;
	policies: IPasswordPolicy[];
}

const PasswordPolicies = ({ isDirty, password, policies }: IPasswordTips) => {
	const { colors } = useTheme();

	const selectTipIconType = (name: string, validation: RegExp) => {
		if (!isDirty) return 'info';

		// This regex checks if there are more than 3 consecutive repeating characters in a string.
		// If the test is successful, the error icon and color should be selected.
		if (name === 'ForbidRepeatingCharacters') {
			if (!validation.test(password)) return 'success';
			return 'error';
		}

		if (validation.test(password)) return 'success';

		return 'error';
	};

	return (
		<View accessible>
			<Text
				accessibilityLabel={i18n.t('Your_Password_Must_Have')}
				accessible
				style={[styles.passwordPoliciesTitle, { color: colors.fontDefault }]}>
				{i18n.t('Your_Password_Must_Have')}
			</Text>
			<View style={styles.policies}>
				{policies.map(item => (
					<Tip iconType={selectTipIconType(item.name, item.regex)} description={item.label} />
				))}
			</View>
		</View>
	);
};

export default PasswordPolicies;
