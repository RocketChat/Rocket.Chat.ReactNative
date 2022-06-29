import React from 'react';
import { Text } from 'react-native';
import { Code as CodeProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { useTheme } from '../../../theme';
import CodeLine from './CodeLine';

interface ICodeProps {
	value: CodeProps['value'];
}

const Code = ({ value }: ICodeProps) => {
	const { colors } = useTheme();

	return (
		<Text
			style={[
				styles.codeBlock,
				{
					color: colors.bodyText,
					backgroundColor: colors.bannerBackground,
					borderColor: colors.borderColor
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
