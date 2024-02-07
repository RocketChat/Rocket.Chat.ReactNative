import { UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';
import React from 'react';
import { Text, View } from 'react-native';

import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import styles from '../styles';
import Inline from './Inline';

interface IUnorderedListProps {
	value: UnorderedListProps['value'];
}

const UnorderedList = ({ value }: IUnorderedListProps) => {
	const { theme } = useTheme();
	return (
		<View>
			{value.map((item, index) => (
				<View key={`${item}-${index}`} style={styles.row}>
					<Text style={[styles.text, styles.listPrefix, { color: themes[theme].bodyText }]}>- </Text>
					<Text style={[styles.text, styles.inline, { color: themes[theme].bodyText }]}>
						<Inline value={item.value} />
					</Text>
				</View>
			))}
		</View>
	);
};

export default UnorderedList;
