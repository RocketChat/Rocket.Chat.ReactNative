import React from 'react';
import { Text, View } from 'react-native';

import { IPasswordPolicy } from '../../lib/hooks/useVerifyPassword';
import Tip from './components/Tip';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import { styles } from './styles';

interface IPasswordTips {
	isDirty: boolean;
	password: string;
	policies: IPasswordPolicy[];
}

const PasswordPolicies = ({ isDirty, password, policies }: IPasswordTips) => {
	const { colors } = useTheme();

	const selectTipIconType = (name: string, validation: RegExp) => {
		if (!isDirty) return 'info';

		// This regex checks if the number of consecutive repeating characters exceeds the limit set by the admin.
		// If the check passes, the error icon and color should be applied.
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
