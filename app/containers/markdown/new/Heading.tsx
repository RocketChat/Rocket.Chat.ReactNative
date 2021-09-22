import React from 'react';
import { Text } from 'react-native';
import { Heading as HeadingProps } from '@rocket.chat/message-parser';

import { themes } from '../../../constants/colors';
import styles from '../styles';
import { useTheme } from '../../../theme';

interface IHeadingProps {
	value: HeadingProps['value'];
	level: HeadingProps['level'];
}

const Heading: React.FC<IHeadingProps> = ({ value, level }) => {
	const { theme } = useTheme();
	const textStyle = styles[`heading${level}`];

	return (
		<>
			{value.map(block => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return <Text style={[textStyle, { color: themes[theme].bodyText }]}>{block.value}</Text>;
					default:
						return null;
				}
			})}
		</>
	);
};

export default Heading;
