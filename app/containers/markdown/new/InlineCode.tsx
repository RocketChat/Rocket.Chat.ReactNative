import React from 'react';
import { Text } from 'react-native';
import { InlineCode as InlineCodeProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import Plain from './Plain';

interface IInlineCodeProps {
	value: InlineCodeProps['value'];
}

const InlineCode = ({ value }: IInlineCodeProps): JSX.Element => {
	const { theme } = useTheme();

	return (
		<Text
			style={[
				styles.codeInline,
				{
					color: themes[theme!].bodyText,
					backgroundColor: themes[theme!].bannerBackground,
					borderColor: themes[theme!].borderColor
				}
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
