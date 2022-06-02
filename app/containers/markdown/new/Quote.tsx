import React from 'react';
import { View } from 'react-native';
import { Quote as QuoteProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import styles from '../styles';
import Paragraph from './Paragraph';

interface IQuoteProps {
	value: QuoteProps['value'];
}

const Quote = ({ value }: IQuoteProps) => {
	const { colors } = useTheme();
	return (
		<View style={styles.container}>
			<View style={[styles.quote, { backgroundColor: colors.borderColor }]} />
			<View style={styles.childContainer}>
				{value.map(item => (
					<Paragraph value={item.value} />
				))}
			</View>
		</View>
	);
};

export default Quote;
