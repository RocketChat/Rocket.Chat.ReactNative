/* eslint-disable react/no-array-index-key */
import React from 'react';
import { View, Text } from 'react-native';
import { OrderedList as OrderedListProps } from '@rocket.chat/message-parser';

import Inline from './Inline';

interface IOrderedListProps {
	value: OrderedListProps['value'];
}

const OrderedList: React.FC<IOrderedListProps> = React.memo(({ value }) => (
	<>
		{value.map((item, index) => (
			<View style={{ flexDirection: 'row' }}>
				<Text>{index + 1}. </Text>
				<Inline value={item.value} />
			</View>
		))}
	</>
));

export default OrderedList;
