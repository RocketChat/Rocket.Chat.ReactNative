import React, { memo } from 'react';
import { Text } from 'react-native';
import { type Plain as PlainProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import styles from '../styles';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = memo(({ value }: IPlainProps): React.ReactElement => {
    'use memo';
    
	const { colors } = useTheme();
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, { color: colors.fontDefault }]}>
			{value}
		</Text>
	);
});

export default Plain;
