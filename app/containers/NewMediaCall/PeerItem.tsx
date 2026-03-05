import { Pressable, StyleSheet } from 'react-native';

import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { PeerItemInner } from './PeerItemInner';
import { useTheme } from '../../theme';
import { isIOS } from '../../lib/methods/helpers';

export const PeerItem = ({ item, onSelectOption }: { item: TPeerItem; onSelectOption: (item: TPeerItem) => void }) => {
	const { colors } = useTheme();
	return (
		<Pressable
			style={({ pressed }) => [
				styles.container,
				{ backgroundColor: pressed && isIOS ? colors.surfaceSelected : colors.surfaceLight }
			]}
			onPress={() => onSelectOption(item)}
			testID={`new-media-call-option-${item.value}`}
			android_ripple={{ color: colors.surfaceSelected }}>
			<PeerItemInner item={item} />
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4
	}
});
