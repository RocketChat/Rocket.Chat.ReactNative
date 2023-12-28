import { Code as CodeProps } from '@rocket.chat/message-parser';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../theme';
import styles from '../styles';
import CodeLine from './CodeLine';

interface ICodeProps {
	value: CodeProps['value'];
}

const Code = ({ value }: ICodeProps): React.ReactElement => {
	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.codeBlock,
				{
					backgroundColor: colors.bannerBackground,
					borderColor: colors.borderColor
				}
			]}
		>
			{value.map((block, index) => {
				const key = `${block.type}-${index}`;
				switch (block.type) {
					case 'CODE_LINE':
						return <CodeLine key={key} value={block.value} />;
					default:
						return null;
				}
			})}
		</View>
	);
};

export default Code;
