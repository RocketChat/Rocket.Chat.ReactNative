import React from 'react';
import { Text } from 'react-native';
import { CodeLine as CodeLineProps } from '@rocket.chat/message-parser';

interface ICodeLineProps {
	value: CodeLineProps['value'];
}

const CodeLine = ({ value }: ICodeLineProps) => {
	if (value.type !== 'PLAIN_TEXT') {
		return null;
	}

	return <Text>{value.value}</Text>;
};

export default CodeLine;
