import { type CodeLine as CodeLineProps } from '@rocket.chat/message-parser';
import React from 'react';
import { Text } from 'react-native';

import { useTheme } from '../../../../theme';
import styles from '../../styles';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface ICodeLineProps {
	value: CodeLineProps['value'];
}

const CodeLine = ({ value }: ICodeLineProps): React.ReactElement | null => {
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	if (value.type !== 'PLAIN_TEXT') {
		return null;
	}

	return <Text style={[styles.codeBlockText, { color: colors.fontDefault, fontSize: scaleFontSize(16), lineHeight: scaleFontSize(22) }]}>{value.value}</Text>;
};

export default CodeLine;
