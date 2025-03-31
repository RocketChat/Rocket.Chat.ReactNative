import React from 'react';
import { UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';
import { View, Text } from 'react-native';

import styles from '../../styles';
import { themes } from '../../../../lib/constants';
import { useTheme } from '../../../../theme';
import Paragraph from '../Paragraph';

interface IUnorderedListProps {
	value: UnorderedListProps['value'];
}

const UnorderedList = ({ value }: IUnorderedListProps) => {
	const { theme } = useTheme();
	return (
		<View>
			{value.map(item => (
				<View style={styles.row}>
					<Text style={[styles.text, { color: themes[theme].fontDefault }]}>{'\u2022 '}</Text>
					<Paragraph value={item.value} />
				</View>
			))}
		</View>
	);
};

export default UnorderedList;
