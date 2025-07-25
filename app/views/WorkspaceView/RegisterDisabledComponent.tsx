import React from 'react';
import { Text } from 'react-native';

import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import styles from './styles';

const RegisterDisabledComponent = () => {
	const { colors } = useTheme();

	const { Accounts_iframe_enabled, registrationText } = useAppSelector(state => ({
		registrationText: state.settings.Accounts_RegistrationForm_LinkReplacementText as string,
		Accounts_iframe_enabled: state.settings.Accounts_iframe_enabled as boolean
	}));

	if (Accounts_iframe_enabled) {
		return null;
	}

	return <Text style={[styles.registrationText, { color: colors.fontSecondaryInfo }]}>{registrationText}</Text>;
};

export default RegisterDisabledComponent;
