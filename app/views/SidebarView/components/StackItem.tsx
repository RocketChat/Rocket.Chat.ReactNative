import { useContext } from 'react';

import { useTheme } from '~/theme';
import * as List from '~/containers/List';
import { NativeListContext } from '~/containers/List/NativeListContext';
import { type IStackItem } from './useStackItems';

const StackItem = ({ item }: { item: IStackItem }) => {
	const { colors } = useTheme();
	const isInNativeList = useContext(NativeListContext);
	const isHighlighted = item.selected && !isInNativeList;

	return (
		<List.Item
			title={item.title}
			left={() => <List.Icon name={item.icon} />}
			onPress={item.onPress}
			backgroundColor={isHighlighted ? colors.strokeLight : undefined}
			testID={item.testID}
			disabled={item.disabled}
		/>
	);
};

export default StackItem;
