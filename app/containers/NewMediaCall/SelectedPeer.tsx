import { View, StyleSheet } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import I18n from '../../i18n';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { PeerItemInner } from './PeerItemInner';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';

export const SelectedPeer = () => {
	const selectedPeer = usePeerAutocompleteStore(state => state.selectedPeer);
	return <SelectedPeerInner selectedPeer={selectedPeer} />;
};

export const SelectedPeerInner = ({ selectedPeer }: { selectedPeer: TPeerItem | null }) => {
	const { colors } = useTheme();
	const clearSelection = usePeerAutocompleteStore(state => state.clearSelection);

	if (!selectedPeer) return null;

	return (
		<View style={styles.container}>
			<View style={[styles.selectedTag, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}>
				<PeerItemInner item={selectedPeer} />
				<BorderlessButton
					onPress={clearSelection}
					testID='new-media-call-clear-selected-peer'
					rippleColor={colors.buttonBackgroundSecondaryPress}
					foreground
					style={styles.removeButton}
					accessibilityLabel={I18n.t('Remove')}
					accessibilityRole='button'
					hitSlop={10}>
					<CustomIcon name={'close'} size={16} color={colors.buttonFontSecondary} />
				</BorderlessButton>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	selectedTag: {
		flexShrink: 1,
		minHeight: 48,
		borderRadius: 4,
		paddingHorizontal: 10,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10
	},
	removeButton: {
		padding: 2
	}
});
