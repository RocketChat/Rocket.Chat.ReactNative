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
		/**
		 * Note: Don't set color here — React Native automatically inherits it from the closest parent Text.
		 * setting a explicit text color would break bold/italic text inside links, which need to inherit the link's color.
		 * See issue `#7035`.
		 */
		<Text accessibilityLabel={value} style={[styles.plainText, ...(textStyle ? [textStyle] : [])]}>
			{value}
		</Text>
	);
};

export default Plain;
