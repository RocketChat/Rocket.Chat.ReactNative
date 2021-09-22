import React from 'react';
import { Text } from 'react-native';
import { CodeLine as CodeLineProps } from '@rocket.chat/message-parser';

interface ICodeLineProps {
	value: CodeLineProps['value'];
}

const CodeLine: React.FC<ICodeLineProps> = ({ value }) => <Text>{value.type === 'PLAIN_TEXT' && value.value}</Text>;

export default CodeLine;
