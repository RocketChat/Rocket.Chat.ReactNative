import React from 'react';
import { UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';
import { View, Text } from 'react-native';

import Inline from './Inline';
import styles from '../styles';
import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';

interface IUnorderedListProps {
	value: UnorderedListProps['value'];
}

const UnorderedList = ({ value }: IUnorderedListProps) => {
	const { theme } = useTheme();
	return (
		<View>
			{value.map(item => (
				<View style={styles.row}>
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
