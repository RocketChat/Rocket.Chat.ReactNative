import { Switch as RNSwitch, SwitchProps } from 'react-native';
import React from 'react';

import { useTheme } from '../../theme';

const Switch = (props: SwitchProps): React.ReactElement => {
	const { colors } = useTheme();

	const trackColor = {
		false: colors.fontDisabled,
		true: colors.buttonBackgroundSuccessPress
	};

	return <RNSwitch trackColor={trackColor} ios_backgroundColor={colors.strokeDark} {...props} />;
};

export default Switch;
