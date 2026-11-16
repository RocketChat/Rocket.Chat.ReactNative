import { type ReactNode } from 'react';
import { View } from 'react-native';
import type { OrderedList, Tasks, UnorderedList } from '@rocket.chat/message-parser';

import styles from '~/containers/markdown/styles';

export type NestedList = OrderedList | UnorderedList | Tasks;

// Servers from 9.0 put indented list lines in `nested` (message-parser >= 0.33).
export type WithNested<T> = T & { nested?: NestedList[] };

export type TRenderList = (list: NestedList) => ReactNode;

interface INestedListsProps {
	lists?: NestedList[];
	renderList: TRenderList;
}

const NestedLists = ({ lists, renderList }: INestedListsProps) => {
	if (!lists?.length) {
		return null;
	}
	return (
		<>
			{lists.map((list, index) => (
				<View key={`${list.type}-${index}`} style={styles.nestedList}>
					{renderList(list)}
				</View>
			))}
		</>
	);
};

export default NestedLists;
