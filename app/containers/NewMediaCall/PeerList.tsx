import { FlatList } from 'react-native';

import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { PeerItem } from './PeerItem';
import * as List from '../List';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';

export const PeerList = () => {
	const setSelectedPeer = usePeerAutocompleteStore(state => state.setSelectedPeer);
	const selectedPeer = usePeerAutocompleteStore(state => state.selectedPeer);
	const options = usePeerAutocompleteStore(state => state.options);

	if (selectedPeer) return null;

	const handleSelectOption = (option: TPeerItem) => {
		setSelectedPeer(option);
	};

	const renderItem = ({ item }: { item: TPeerItem }) => <PeerItem item={item} onSelectOption={handleSelectOption} />;

	return (
		<FlatList
			data={options}
			contentContainerStyle={{ flexShrink: 1 }}
			keyExtractor={item => `${item.type}:${item.value}`}
			keyboardShouldPersistTaps='always'
			renderItem={renderItem}
			ItemSeparatorComponent={List.Separator}
		/>
	);
};
