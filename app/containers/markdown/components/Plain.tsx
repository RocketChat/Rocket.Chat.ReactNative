import { Text } from 'react-native';
import { type Plain as PlainProps } from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { useTheme } from '../../../theme';
import styles from '../styles';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): ReactElement => {
	const { colors } = useTheme();
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, { color: colors.fontDefault }]}>
			{value}
		</Text>
	);
};

export default Plain;
