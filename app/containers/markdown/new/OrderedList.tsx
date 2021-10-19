import React from 'react';
import { View, Text } from 'react-native';
import { OrderedList as OrderedListProps } from '@rocket.chat/message-parser';

import Inline from './Inline';
import styles from '../styles';

interface IOrderedListProps {
	value: OrderedListProps['value'];
}

const OrderedList = React.memo(
	({ value }: IOrderedListProps): JSX.Element => (
		<View>
			{value.map((item, index) => (
				<View style={styles.container}>
					<Text style={styles.text}>
						<Text>{index + 1}. </Text>
						<Inline value={item.value} />
					</Text>
				</View>
			))}
		</View>
	)
);

export default OrderedList;
