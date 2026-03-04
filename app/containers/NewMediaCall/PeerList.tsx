import { FlatList } from 'react-native';

import type { TPeerInfo, TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { PeerItem } from './PeerItem';
import * as List from '../List';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';

export const PeerList = () => {
	const setSelectedPeer = usePeerAutocompleteStore(state => state.setSelectedPeer);
	const selectedPeer = usePeerAutocompleteStore(state => state.selectedPeer);
	const setFilter = usePeerAutocompleteStore(state => state.setFilter);
	const fetchOptions = usePeerAutocompleteStore(state => state.fetchOptions);
	const options = usePeerAutocompleteStore(state => state.options);

	if (selectedPeer) return null;

	const handleSelectOption = (option: TPeerItem) => {
		const peerInfo: TPeerInfo =
			option.type === 'sip'
				? { number: option.label }
				: {
						userId: option.value,
						displayName: option.label,
						username: option.username,
						callerId: option.callerId,
						status: option.status
				  };

		setSelectedPeer(peerInfo);
		setFilter('');
		fetchOptions('');
	};

	const renderItem = ({ item }: { item: TPeerItem }) => <PeerItem item={item} onSelectOption={handleSelectOption} />;

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
