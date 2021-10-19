import React from 'react';
import { UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';
import { View, Text } from 'react-native';

import Inline from './Inline';
import styles from '../styles';

interface IUnorderedListProps {
	value: UnorderedListProps['value'];
}

const UnorderedList = ({ value }: IUnorderedListProps): JSX.Element => (
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
);

export default UnorderedList;
