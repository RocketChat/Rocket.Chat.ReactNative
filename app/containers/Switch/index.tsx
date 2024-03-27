import { Switch as RNSwitch, SwitchProps } from 'react-native';
import React from 'react';

import { useTheme } from '../../theme';

const Switch = (props: SwitchProps): React.ReactElement => {
	const { colors } = useTheme();

	const trackColor = {
		false: colors.buttonBackgroundDangerPress,
		true: colors.buttonBackgroundSuccessPress
	};

	return <RNSwitch trackColor={trackColor} {...props} />;
};

export default Switch;
