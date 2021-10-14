import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderedList as OrderedListProps } from '@rocket.chat/message-parser';

import Inline from './Inline';

interface IOrderedListProps {
	value: OrderedListProps['value'];
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	}
});

const OrderedList = React.memo(
	({ value }: IOrderedListProps): JSX.Element => (
		<>
			{value.map((item, index) => (
				<View style={styles.container}>
					<Text>{index + 1}. </Text>
					<Inline value={item.value} />
				</View>
			))}
		</>
	)
);

export default OrderedList;
