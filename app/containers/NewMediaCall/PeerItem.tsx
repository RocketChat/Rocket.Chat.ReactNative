import { Pressable, StyleSheet } from 'react-native';

import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { PeerItemInner } from './PeerItemInner';

export const PeerItem = ({ item, onSelectOption }: { item: TPeerItem; onSelectOption: (item: TPeerItem) => void }) => (
	<Pressable style={styles.container} onPress={() => onSelectOption(item)} testID={`new-media-call-option-${item.value}`}>
		<PeerItemInner item={item} />
	</Pressable>
);

const styles = StyleSheet.create({
	container: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4
	}
});
