import React from 'react';
import { View } from 'react-native';
import { type Code as CodeProps } from '@rocket.chat/message-parser';

import styles from '../../styles';
import { useTheme } from '../../../../theme';
import CodeLine from './CodeLine';
import getBlockValueString from '../../../../lib/methods/getBlockValueString';

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
			{value.map((block, index) => {
				const key = `${block.type}-${getBlockValueString(block.value)}-${index}`;
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
