import React from 'react';
import { Text } from 'react-native';
import { Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import Inline from './Inline';
import styles from '../styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../constants/colors';

interface IParagraphProps {
	value: ParagraphProps['value'];
}

const Paragraph = ({ value }: IParagraphProps) => {
	const { theme } = useTheme();
	return (
		<Text style={[styles.text, { color: themes[theme].bodyText }]}>
			<Inline value={value} />
		</Text>
	);
};

export default Paragraph;
