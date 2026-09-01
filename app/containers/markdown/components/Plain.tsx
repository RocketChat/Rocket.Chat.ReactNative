import { type ReactElement } from 'react';
import { Text } from 'react-native';
import { type Plain as PlainProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import styles from '../styles';
import { useMarkdownContext } from '../contexts/MarkdownContext';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): ReactElement => {
	const { colors } = useTheme();
	const { textStyle } = useMarkdownContext();
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, { color: colors.fontDefault }, ...(textStyle ? [textStyle] : [])]}>
			{value}
		</Text>
	);
};

export default Plain;
