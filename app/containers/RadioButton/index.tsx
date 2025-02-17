import React from 'react';
import { RadioButton as RadioButtonUiLib } from 'react-native-ui-lib';

import { useTheme } from '../../theme';

export const RadioButton = ({ check, testID, size }: { check: boolean; testID?: string; size?: number }): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<RadioButtonUiLib
			testID={testID}
			selected={check}
			size={size || 20}
			color={check ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundPrimaryDisabled}
		/>
	);
};
