import React from 'react';

import Button from '../Button';
import OrSeparator from '../OrSeparator';
import { useTheme } from '../../theme';
import styles from './styles';
import i18n from '../../i18n';
import { IServicesSeparator } from './interfaces';

const ServicesSeparator = ({ services, separator, collapsed, onPress }: IServicesSeparator) => {
	const { colors } = useTheme();

	const { length } = Object.values(services);

	if (length > 3 && separator) {
		return (
			<>
				<Button
					title={collapsed ? i18n.t('Onboarding_more_options') : i18n.t('Onboarding_less_options')}
					type='secondary'
					onPress={onPress}
					style={styles.options}
					color={colors.fontHint}
				/>
				<OrSeparator />
			</>
		);
	}
	if (length > 0 && separator) {
		return <OrSeparator />;
	}
	return null;
};

export default ServicesSeparator;
