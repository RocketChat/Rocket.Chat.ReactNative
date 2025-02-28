import React from 'react';
import { View } from 'react-native';
import { Code as CodeProps } from '@rocket.chat/message-parser';

import styles from '../../styles';
import { useTheme } from '../../../../theme';
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
					backgroundColor: colors.surfaceNeutral,
					borderColor: colors.strokeLight
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
		</View>
	);
};

export default Code;
