import { type ReactElement } from 'react';
import { View, Text } from 'react-native';
import { type OrderedList as OrderedListProps } from '@rocket.chat/message-parser';

import Inline from '../Inline';
import NestedLists, { type TRenderList, type WithNested } from './NestedLists';
import styles from '~/containers/markdown/styles';
import { useTheme } from '~/theme';

interface IOrderedListProps {
	value: WithNested<OrderedListProps['value'][number]>[];
	renderList: TRenderList;
}

const OrderedList = ({ value, renderList }: IOrderedListProps): ReactElement => {
	const { colors } = useTheme();
	return (
		<View>
			{value.map((item, index) => (
				<View key={index}>
					<View style={styles.row}>
						<Text style={[styles.text, styles.listPrefix, { color: colors.fontDefault }]}>{item.number}. </Text>
						<Text style={[styles.text, styles.inline, { color: colors.fontDefault }]}>
							<Inline value={item.value} />
						</Text>
					</View>
					<NestedLists lists={item.nested} renderList={renderList} />
				</View>
			))}
		</View>
	);
};

export default OrderedList;
