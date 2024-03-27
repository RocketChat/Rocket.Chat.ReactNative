import React from 'react';
import { Text } from 'react-native';
import { Heading as HeadingProps } from '@rocket.chat/message-parser';

import { themes } from '../../../lib/constants';
import styles from '../styles';
import { useTheme } from '../../../theme';

interface IHeadingProps {
	value: HeadingProps['value'];
	level: HeadingProps['level'];
}

const Heading = ({ value, level }: IHeadingProps) => {
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
};

export default Heading;
