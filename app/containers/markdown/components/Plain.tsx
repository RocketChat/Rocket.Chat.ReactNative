import React, { useContext } from 'react';
import { Text } from 'react-native';
import { type Plain as PlainProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import MarkdownContext from '../contexts/MarkdownContext';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): React.ReactElement => {
	const { textStyle } = useContext(MarkdownContext);
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, ...(textStyle ? [textStyle] : [])]}>
			{value}
		</Text>
	);
};

export default Plain;
