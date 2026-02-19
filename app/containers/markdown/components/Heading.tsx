import React from 'react';
import { Text } from 'react-native';
import { type Heading as HeadingProps } from '@rocket.chat/message-parser';

import { themes } from '../../../lib/constants/colors';
import styles from '../styles';
import { useTheme } from '../../../theme';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface IHeadingProps {
	value: HeadingProps['value'];
	level: HeadingProps['level'];
}

const Heading = ({ value, level }: IHeadingProps) => {
	const { theme } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	const textStyle = styles[`heading${level}`];
	
	// Map heading levels to base font sizes
	const headingSizes: { [key: number]: number } = {
		1: 24,
		2: 22,
		3: 20,
		4: 18,
		5: 16,
		6: 14
	};
	const baseSize = headingSizes[level] || 16;

	return (
		<Text style={[textStyle, { color: themes[theme].fontDefault, fontSize: scaleFontSize(baseSize) }]}>
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
