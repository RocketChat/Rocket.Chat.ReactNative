import React from 'react';
import { View, Text } from 'react-native';
import { OrderedList as OrderedListProps } from '@rocket.chat/message-parser';

import Inline from './Inline';
import styles from '../styles';
import { useTheme } from '../../../theme';

interface IOrderedListProps {
	value: OrderedListProps['value'];
}

const OrderedList = ({ value }: IOrderedListProps): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View>
			{value.map(item => (
				<View style={styles.row} key={item.number?.toString()}>
					<Text style={[styles.text, { color: colors.bodyText }]}>{item.number}. </Text>
					<Text style={{ color: colors.bodyText }}>
						<Inline value={item.value} />
					</Text>
				</View>
			))}
		</View>
	);
};

export default OrderedList;
