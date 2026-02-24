import React from 'react';
import { View } from 'react-native';
import { type CodeLine as CodeLineType, type Code as CodeProps } from '@rocket.chat/message-parser';

import styles from '../../styles';
import { useTheme } from '../../../../theme';
import CodeLine from './CodeLine';

interface ICodeProps {
	value: CodeProps['value'];
}

type TCodeLineWithID = CodeLineType & { _id: string };

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
			{value.map(b => {
				const block = b as TCodeLineWithID;
				switch (block.type) {
					case 'CODE_LINE':
						return <CodeLine key={block._id} value={block.value} />;
					default:
						return null;
				}
			})}
		</View>
	);
};

export default Code;
