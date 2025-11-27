import React from 'react';
import { type ListItem, type UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';
import { View, Text } from 'react-native';

import Inline from '../Inline';
import styles from '../../styles';
import { themes } from '../../../../lib/constants/colors';
import { useTheme } from '../../../../theme';

interface IUnorderedListProps {
	value: UnorderedListProps['value'];
}

type TListItemWithID = ListItem & { _id: string };

const UnorderedList = ({ value }: IUnorderedListProps) => {
	const { theme } = useTheme();
	return (
		<View>
			{value.map(i => {
				const item = i as TListItemWithID;
				return (
					<View key={item._id} style={styles.row}>
						<Text style={[styles.text, { color: themes[theme].fontDefault }]}>{'\u2022 '}</Text>
						<Text style={[styles.inline, { color: themes[theme].fontDefault }]}>
							<Inline value={item.value} />
						</Text>
					</View>
				);
			})}
		</View>
	);
};

export default UnorderedList;
