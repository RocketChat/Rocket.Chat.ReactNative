import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { Plain as PlainProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import styles from '../styles';

interface IPlainProps {
	value: PlainProps['value'];
	style?: StyleProp<TextStyle>;
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
