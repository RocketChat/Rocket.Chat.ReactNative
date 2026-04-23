import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { type InlineCode as InlineCodeProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { themes } from '../../../lib/constants/colors';
import { useTheme } from '../../../theme';

interface IInlineCodeProps {
	value: InlineCodeProps['value'];
	style?: TextStyle;
}

const InlineCode = ({ value, style }: IInlineCodeProps) => {
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
						return <Text style={style}>{block.value}</Text>;
					default:
						return null;
				}
			})(value)}
		</Text>
	);
};

export default InlineCode;
