import { FlatList } from 'react-native';

import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { PeerItem } from './PeerItem';
import * as List from '../List';

export const PeerList = ({
	shouldShowOptions,
	options,
	onSelectOption
}: {
	shouldShowOptions: boolean;
	options: TPeerItem[];
	onSelectOption: (item: TPeerItem) => void;
}) => {
	if (!shouldShowOptions) return null;

	const renderItem = ({ item }: { item: TPeerItem }) => <PeerItem item={item} onSelectOption={onSelectOption} />;

	return (
		<FlatList
			data={options}
			contentContainerStyle={{ flexShrink: 1 }}
			keyExtractor={item => item.value}
			keyboardShouldPersistTaps='always'
			renderItem={renderItem}
			ItemSeparatorComponent={List.Separator}
		/>
	);
};
