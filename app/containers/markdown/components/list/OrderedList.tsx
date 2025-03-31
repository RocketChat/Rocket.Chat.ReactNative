import React from 'react';
import { View, Text } from 'react-native';
import { OrderedList as OrderedListProps } from '@rocket.chat/message-parser';

import styles from '../../styles';
import { useTheme } from '../../../../theme';
import Paragraph from '../Paragraph';

interface IOrderedListProps {
	value: OrderedListProps['value'];
}

const OrderedList = ({ value }: IOrderedListProps): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View>
			{value.map(item => (
				<View style={styles.row} key={item.number?.toString()}>
					<Text style={[styles.text, styles.listPrefix, { color: colors.fontDefault }]}>{item.number}. </Text>
					<Paragraph value={item.value} />
				</View>
			))}
		</View>
	);
};

export default OrderedList;
