import React from 'react';
import SegmentedControl, {  } from '@react-native-segmented-control/segmented-control';

import { useTheme } from '../../theme';

export const RadioButton = ({ check, testID, size }: { check: boolean; testID?: string; size?: number }): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<SegmentedControl
			testID={testID}
			selectedIndex={check}
			size={size || 20}
			color={check ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundPrimaryDisabled}
		/>
	);
};
