import { type ReactElement } from 'react';

import { useTheme } from '~/theme';
import { CustomIcon } from '../CustomIcon';
import { useIsNativeList } from '../List/native/context';
import Indicator from '../NativeListRow/components/Indicator';

const Radio = ({ check, testID, size }: { check: boolean; testID?: string; size?: number }): ReactElement | null => {
	const { colors } = useTheme();
	const isNativeList = useIsNativeList();

	if (isNativeList) {
		return check ? <Indicator indicator='check' /> : null;
	}

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
