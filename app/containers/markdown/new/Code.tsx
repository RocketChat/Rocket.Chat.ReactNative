import React from 'react';
import { Text } from 'react-native';
import { Code as CodeProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import CodeLine from './CodeLine';

interface ICodeProps {
	value: CodeProps['value'];
}

const Code = ({ value }: ICodeProps) => {
	const { theme } = useTheme();

	return (
		<Text
			style={[
				styles.codeBlock,
				{
					color: themes[theme].bodyText,
					backgroundColor: themes[theme].bannerBackground,
					borderColor: themes[theme].borderColor
				}
			]}>
			{value.map(block => {
				switch (block.type) {
					case 'CODE_LINE':
						return <CodeLine value={block.value} />;
					default:
						return null;
				}
			})}
		</Text>
	);
};

export default Code;
