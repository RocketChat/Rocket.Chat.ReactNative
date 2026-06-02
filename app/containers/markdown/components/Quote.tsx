import React from 'react';
import { View } from 'react-native';
import { type Paragraph as ParagraphType, type Quote as QuoteProps } from '@rocket.chat/message-parser';

import { themes } from '../../../lib/constants/colors';
import { useTheme } from '../../../theme';
import styles from '../styles';
import Paragraph from './Paragraph';

interface IQuoteProps {
	value: QuoteProps['value'];
}

type TParagraphWithID = ParagraphType & { _id: string };

const Quote = ({ value }: IQuoteProps) => {
	const { theme } = useTheme();
	return (
		<View style={styles.container}>
			<View style={[styles.quote, { backgroundColor: themes[theme].strokeLight }]} />
			<View style={styles.childContainer}>
				{value.map(i => {
					const item = i as TParagraphWithID;
					return <Paragraph key={item._id} value={item.value} />;
				})}
			</View>
		</View>
	);
};

export default Quote;
