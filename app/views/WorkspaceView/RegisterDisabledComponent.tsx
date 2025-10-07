import React from 'react';
import { Text } from 'react-native';

import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useTheme } from '../../theme';
import styles from './styles';
import { REGISTRATION_DISABLED_MESSAGE } from '../../config/appConfig';

const RegisterDisabledComponent = () => {
        const { colors } = useTheme();

        const { Accounts_iframe_enabled } = useAppSelector(state => ({
                Accounts_iframe_enabled: state.settings.Accounts_iframe_enabled as boolean
        }));

        if (Accounts_iframe_enabled) {
                return null;
        }

        return (
                <Text style={[styles.registrationText, { color: colors.fontSecondaryInfo }]}>
                        {REGISTRATION_DISABLED_MESSAGE}
                </Text>
        );
};

export default RegisterDisabledComponent;
