import { AccessibilityInfo, Switch as RNSwitch, type SwitchProps } from 'react-native';
import React from 'react';

import { useTheme } from '../../theme';
import { isIOS } from '../../lib/methods/helpers';
import I18n from '../../i18n';

const Switch = (props: SwitchProps): React.ReactElement => {
	const { colors } = useTheme();

	const trackColor = {
		false: colors.strokeDark,
		true: colors.buttonBackgroundPrimaryDefault
	};

	const onValueChange = (value: boolean) => {
		props?.onValueChange?.(value);
		if (isIOS) {
			AccessibilityInfo.announceForAccessibility(I18n.t(value ? 'Enabled' : 'Disabled'));
		}
	};

	return (
		<RNSwitch
			onValueChange={onValueChange}
			trackColor={trackColor}
			thumbColor={colors.fontPureWhite}
			ios_backgroundColor={colors.strokeDark}
			{...props}
		/>
	);
};

export default Switch;
