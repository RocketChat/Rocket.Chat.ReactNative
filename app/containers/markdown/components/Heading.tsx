import React, { memo } from 'react';
import { Text } from 'react-native';
import { type Heading as HeadingProps } from '@rocket.chat/message-parser';

import { themes } from '../../../lib/constants/colors';
import styles from '../styles';
import { useTheme } from '../../../theme';

interface IHeadingProps {
	value: HeadingProps['value'];
	level: HeadingProps['level'];
}

const Heading = memo(({ value, level }: IHeadingProps) => {
	'use memo';

	const { theme } = useTheme();
	const textStyle = styles[`heading${level}`];

	return (
		<Text style={[textStyle, { color: themes[theme].fontDefault }]}>
			{value.map(block => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return block.value;
					default:
						return null;
				}
			})}
		</Text>
	);
});

export default Heading;
