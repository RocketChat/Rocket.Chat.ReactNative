import React from 'react';
import { View, Text } from 'react-native';
import { OrderedList as OrderedListProps } from '@rocket.chat/message-parser';

import Inline from './Inline';
import styles from '../styles';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';

interface IOrderedListProps {
	value: OrderedListProps['value'];
}

const OrderedList = ({ value }: IOrderedListProps): JSX.Element => {
	const { theme } = useTheme();
	return (
		<View>
			{value.map((item, index) => (
				<View style={styles.row}>
					<Text style={[styles.text, { color: themes[theme!].bodyText }]}>{index + 1}. </Text>
					<Inline value={item.value} />
				</View>
			))}
		</View>
	);
};

export default OrderedList;
