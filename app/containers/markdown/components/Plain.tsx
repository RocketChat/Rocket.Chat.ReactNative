import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { type Plain as PlainProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import styles from '../styles';

interface IPlainProps {
	value: PlainProps['value'];
	style?: TextStyle;
}

const Plain = ({ value, style }: IPlainProps): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, { color: colors.fontDefault }, style]}>
			{value}
		</Text>
	);
};

export default Plain;
