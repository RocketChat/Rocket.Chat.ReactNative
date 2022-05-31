import React from 'react';

import Button from '../Button';
import OrSeparator from '../OrSeparator';
import { useTheme } from '../../theme';
import styles from './styles';
import I18n from '../../i18n';
import { IServices } from '../../selectors/login';

interface IServicesSeparator {
	services: IServices;
	separator: boolean;
	collapsed: boolean;
	onPressButtonSeparator(): void;
}

const ServicesSeparator = ({ services, separator, collapsed, onPressButtonSeparator }: IServicesSeparator) => {
	const { colors, theme } = useTheme();

	const { length } = Object.values(services);

	if (length > 3 && separator) {
		return (
			<>
				<Button
					title={collapsed ? I18n.t('Onboarding_more_options') : I18n.t('Onboarding_less_options')}
					type='secondary'
					onPress={onPressButtonSeparator}
					style={styles.options}
					color={colors.actionTintColor}
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
