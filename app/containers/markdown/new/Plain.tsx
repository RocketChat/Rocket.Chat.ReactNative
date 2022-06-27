import React from 'react';
import { Text } from 'react-native';
import { Plain as PlainProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { useTheme } from '../../../theme';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps) => {
	const { colors } = useTheme();
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, { color: colors.bodyText }]}>
			{value}
		</Text>
	);
};

export default Plain;
