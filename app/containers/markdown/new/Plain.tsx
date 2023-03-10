import React from 'react';
import { Text } from 'react-native';
import { Plain as PlainProps } from '@rocket.chat/message-parser';

import styles from '../styles';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): React.ReactElement => (
	<Text accessibilityLabel={value} style={styles.plainText}>
		{value}
	</Text>
);

export default Plain;
