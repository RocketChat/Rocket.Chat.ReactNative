import React from 'react';
import SegmentedControl, {  } from '@react-native-segmented-control/segmented-control';

import { useTheme } from '../../theme';

export const RadioButton = ({ check, testID, size }: { check: boolean; testID?: string; size?: number }): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<SegmentedControl
			testID={testID}
			values={['']}
			selectedIndex={0}
			style={{ width: size || 20, height: size || 20, backgroundColor: check ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundPrimaryDisabled }}
		/>
	);
};
