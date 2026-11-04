import { type UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';
import { View, Text } from 'react-native';

import Inline from '../Inline';
import NestedLists, { type TRenderList, type WithNested } from './NestedLists';
import styles from '~/containers/markdown/styles';
import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';

interface IUnorderedListProps {
	value: WithNested<UnorderedListProps['value'][number]>[];
	renderList: TRenderList;
}

const UnorderedList = ({ value, renderList }: IUnorderedListProps) => {
	const { theme } = useTheme();
	return (
		<View>
			{value.map((item, index) => (
				<View key={index}>
					<View style={styles.row}>
						<Text style={[styles.text, { color: themes[theme].fontDefault }]}>{'\u2022 '}</Text>
						<Text style={[styles.inline, { color: themes[theme].fontDefault }]}>
							<Inline value={item.value} />
						</Text>
					</View>
					<NestedLists lists={item.nested} renderList={renderList} />
				</View>
			))}
		</View>
	);
};

export default UnorderedList;
