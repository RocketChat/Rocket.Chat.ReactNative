import React from 'react';
import { Text } from 'react-native';
import { Plain as PlainProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { useTheme } from '../../../theme';

interface IPlainProps {
	value: PlainProps['value'];
	isLink?: boolean;
}

const Plain = ({ value, isLink = false }: IPlainProps) => {
	const { colors } = useTheme();
	const color = isLink ? { color: colors.actionTintColor } : { color: colors.bodyText };
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, color]}>
			{value}
		</Text>
	);
};

export default Plain;
