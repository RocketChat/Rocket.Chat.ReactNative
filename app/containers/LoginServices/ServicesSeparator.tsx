import React from 'react';

import Button from '../Button';
import OrSeparator from '../OrSeparator';
import { useTheme } from '../../theme';
import styles from './styles';
import I18n from '../../i18n';
import { IServicesSeparator } from './interfaces';

const ServicesSeparator = ({ services, separator, collapsed, onPress }: IServicesSeparator) => {
	const { colors, theme } = useTheme();

	const { length } = Object.values(services);

	if (length > 3 && separator) {
		return (
			<>
				<Button
					title={collapsed ? I18n.t('Onboarding_more_options') : I18n.t('Onboarding_less_options')}
					type='secondary'
					onPress={onPress}
					style={styles.options}
					color={colors.fontHint}
				/>
				<OrSeparator theme={theme} />
			</>
		);
	}
	if (length > 0 && separator) {
		return <OrSeparator theme={theme} />;
	}
	return null;
};

export default ServicesSeparator;
