import React from 'react';
import { RadioButton } from 'react-native-ui-lib';

import { useTheme } from '../../theme';

export const CheckRadioButton = ({
	check,
	testID,
	size
}: {
	check: boolean;
	testID?: string;
	size?: number;
}): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<RadioButton
			testID={testID}
			selected={check}
			size={size || 20}
			color={check ? colors.tintActive : colors.auxiliaryTintColor}
		/>
	);
};
