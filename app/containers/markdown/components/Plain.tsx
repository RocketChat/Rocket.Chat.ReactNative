import React from 'react';
import { Text } from 'react-native';
import { Plain as PlainProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<Text accessibilityLabel={value} style={{ color: colors.fontDefault }}>
			{value}
		</Text>
	);
};

export default Plain;
