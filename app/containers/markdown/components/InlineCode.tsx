import React from 'react';
import { Text } from 'react-native';
import { InlineCode as InlineCodeProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';

interface IInlineCodeProps {
	value: InlineCodeProps['value'];
}

const InlineCode = ({ value }: IInlineCodeProps) => {
	const { theme } = useTheme();

	return (
		<Text
			style={[
				styles.codeInline,
				{
					color: themes[theme].fontDefault,
					backgroundColor: themes[theme].surfaceNeutral,
					borderColor: themes[theme].strokeLight
				}
			]}>
			{(block => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return <Text>{block.value}</Text>;
					default:
						return null;
				}
			})(value)}
		</Text>
	);
};

export default InlineCode;
