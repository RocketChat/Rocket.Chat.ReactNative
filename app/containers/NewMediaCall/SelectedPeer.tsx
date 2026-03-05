import { View, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import I18n from '../../i18n';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { PeerItemInner } from './PeerItemInner';

export const SelectedPeer = () => {
	const { colors } = useTheme();
	const selectedPeer = usePeerAutocompleteStore(state => state.selectedPeer);
	const clearSelection = usePeerAutocompleteStore(state => state.clearSelection);

	if (!selectedPeer) return null;

	return (
		<View style={styles.selectedTagContainer}>
			<View style={[styles.selectedTag, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}>
				<PeerItemInner item={selectedPeer} />
				<Pressable
					onPress={clearSelection}
					style={styles.removeButton}
					accessibilityRole='button'
					accessibilityLabel={I18n.t('Remove')}
					testID='new-media-call-clear-selected-peer'
					android_ripple={{ color: colors.surfaceSelected }}>
					<CustomIcon name='close' size={16} color={colors.buttonFontSecondary} />
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	selectedTagContainer: {
		marginBottom: 16
	},
	selectedTag: {
		alignSelf: 'flex-start',
		minHeight: 48,
		borderRadius: 4,
		paddingHorizontal: 10,
		flexDirection: 'row',
		alignItems: 'center'
	},
	removeButton: {
		marginLeft: 10,
		padding: 2
	}
});
