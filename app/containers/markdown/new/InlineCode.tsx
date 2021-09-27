import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { InlineCode as InlineCodeProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import Plain from './Plain';

interface IInlineCodeProps {
	value: InlineCodeProps['value'];
	style: StyleProp<TextStyle>[];
}

const InlineCode: React.FC<IInlineCodeProps> = ({ value, style }) => {
	const { theme } = useTheme();

	return (
		<Text
			style={[
				{
					...styles.codeInline,
					color: themes[theme].bodyText,
					backgroundColor: themes[theme].bannerBackground,
					borderColor: themes[theme].borderColor
				},
				...style
			]}>
			{(block => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return <Plain value={block.value} />;
					default:
						return null;
				}
			})(value)}
		</Text>
	);
};

export default InlineCode;
