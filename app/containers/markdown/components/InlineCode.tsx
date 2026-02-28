import React from 'react';
import { Text } from 'react-native';
import { type InlineCode as InlineCodeProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { themes } from '../../../lib/constants/colors';
import { useTheme } from '../../../theme';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface IInlineCodeProps {
	value: InlineCodeProps['value'];
}

const InlineCode = ({ value }: IInlineCodeProps) => {
	const { theme } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();

	return (
		<Text
			style={[
				styles.codeInline,
				{
					color: themes[theme].fontDefault,
					backgroundColor: themes[theme].surfaceNeutral,
					borderColor: themes[theme].strokeLight,
					fontSize: scaleFontSize(16),
					lineHeight: scaleFontSize(22)
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
