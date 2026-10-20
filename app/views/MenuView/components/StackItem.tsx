import * as List from '~/containers/List';
import { type IStackItem } from './useStackItems';

const StackItem = ({ item }: { item: IStackItem }) => (
	<List.Item
		title={item.title}
		left={() => <List.Icon name={item.icon} />}
		onPress={item.onPress}
		testID={item.testID}
		disabled={item.disabled}
	/>
);

export default StackItem;
