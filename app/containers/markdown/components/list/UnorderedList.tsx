import React from 'react';
import { type UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';
import { View, Text } from 'react-native';

import Inline from '../Inline';
import styles from '../../styles';
import { themes } from '../../../../lib/constants/colors';
import { useTheme } from '../../../../theme';

interface IUnorderedListProps {
	value: UnorderedListProps['value'];
}

const UnorderedList = ({ value }: IUnorderedListProps) => {
	const { theme } = useTheme();
	return (
		<View>
			{value.map((item, index) => {
				const key = `${item.value?.toString?.().slice(0, 20) || index}-${index}`;
				return (
					<View key={key} style={styles.row}>
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
