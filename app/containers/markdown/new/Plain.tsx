import React from 'react';
import { Text } from 'react-native';
import { Plain as PlainProps } from '@rocket.chat/message-parser';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): JSX.Element => <Text accessibilityLabel={value}>{value}</Text>;

export default Plain;
