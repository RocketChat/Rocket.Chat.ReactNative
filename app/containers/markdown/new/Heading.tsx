import React from 'react';
import { Text } from 'react-native';
import { Heading as HeadingProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { useTheme } from '../../../theme';

interface IHeadingProps {
	value: HeadingProps['value'];
	level: HeadingProps['level'];
}

const Heading = ({ value, level }: IHeadingProps) => {
	const { colors } = useTheme();
	const textStyle = styles[`heading${level}`];

	return (
		<Text style={[textStyle, { color: colors.bodyText }]}>
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
