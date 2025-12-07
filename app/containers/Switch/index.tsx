import { Switch as RNSwitch, type SwitchProps } from 'react-native';
import React from 'react';

import { useTheme } from '../../theme';

const Switch = (props: SwitchProps): React.ReactElement => {
	const { colors } = useTheme();

	const trackColor = {
		false: colors.strokeDark,
		true: colors.buttonBackgroundPrimaryDefault
	};

	return (
		<RNSwitch trackColor={trackColor} thumbColor={colors.fontPureWhite} ios_backgroundColor={colors.strokeDark} {...props} />
	);
};

export default Switch;
