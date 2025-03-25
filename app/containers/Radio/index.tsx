import React from 'react';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';

const Radio = ({ check, testID, size }: { check: boolean; testID?: string; size?: number }): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<CustomIcon
			testID={testID}
			name={check ? 'radio-checked' : 'radio-unchecked'}
			size={size || 20}
			color={check ? colors.buttonBackgroundPrimaryDefault : colors.strokeMedium}
		/>
	);
};

export default Radio;
