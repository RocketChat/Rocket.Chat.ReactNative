import { Quote as QuoteProps } from '@rocket.chat/message-parser';
import React from 'react';
import { View } from 'react-native';

import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import styles from '../styles';
import Paragraph from './Paragraph';

interface IQuoteProps {
	value: QuoteProps['value'];
}

const Quote = ({ value }: IQuoteProps) => {
	const { theme } = useTheme();
	return (
		<View style={styles.container}>
			<View style={[styles.quote, { backgroundColor: themes[theme].borderColor }]} />
			<View style={styles.childContainer}>
				{value.map((item, index) => (
					<Paragraph key={`${item.type}-${index}`} value={item.value} />
				))}
			</View>
		</View>
	);
};

export default Quote;
