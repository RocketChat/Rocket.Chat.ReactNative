import React from 'react';
import { Text } from 'react-native';
import { Plain as PlainProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../constants/colors';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): JSX.Element => {
	const { theme } = useTheme();
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, { color: themes[theme!].bodyText }]}>
			{value}
		</Text>
	);
};

export default Plain;
