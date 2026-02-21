import { type CodeLine as CodeLineProps } from '@rocket.chat/message-parser';
import { Text } from 'react-native';

import { useTheme } from '../../../../theme';
import styles from '../../styles';

interface ICodeLineProps {
	value: CodeLineProps['value'];
}

const CodeLine = ({ value }: ICodeLineProps) => {
	const { colors } = useTheme();
	if (value.type !== 'PLAIN_TEXT') {
		return null;
	}

	return <Text style={[styles.codeBlockText, { color: colors.fontDefault }]}>{value.value}</Text>;
};

export default CodeLine;
