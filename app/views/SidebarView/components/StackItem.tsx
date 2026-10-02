import { useTheme } from '~/theme';
import * as List from '~/containers/List';
import { type IStackItem } from './useStackItems';

const StackItem = ({ item }: { item: IStackItem }) => {
	const { colors } = useTheme();

	return (
		<List.Item
			title={item.title}
			left={() => <List.Icon name={item.icon} />}
			onPress={item.onPress}
			backgroundColor={item.selected ? colors.strokeLight : undefined}
			testID={item.testID}
			disabled={item.disabled}
		/>
	);
};

export default StackItem;
