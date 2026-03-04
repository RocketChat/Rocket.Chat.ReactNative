import { useMemo } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Avatar from '../Avatar';
import Status from '../Status';
import sharedStyles from '../../views/Styles';
import I18n from '../../i18n';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';

export const SelectedPeer = () => {
	const { colors } = useTheme();
	const selectedPeer = usePeerAutocompleteStore(state => state.selectedPeer);
	const clearSelection = usePeerAutocompleteStore(state => state.clearSelection);

	const selectedLabel = useMemo(() => {
		if (!selectedPeer) {
			return '';
		}

		return 'number' in selectedPeer ? selectedPeer.number : selectedPeer.displayName;
	}, [selectedPeer]);

	if (!selectedPeer) return null;

	return (
		<View style={styles.selectedTagContainer}>
			<View style={[styles.selectedTag, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}>
				{'number' in selectedPeer ? (
					<CustomIcon name='phone-in' size={20} color={colors.fontSecondaryInfo} />
				) : (
					<>
						<Avatar text={selectedPeer.username || selectedPeer.displayName} size={28} />
						<View style={styles.statusWrap}>
							<Status id={selectedPeer.userId} status={selectedPeer.status || 'offline'} size={20} />
						</View>
					</>
				)}
				<Text style={[styles.selectedTagName, { color: colors.buttonFontSecondary }]}>{selectedLabel}</Text>
				<Pressable
					onPress={clearSelection}
					style={styles.removeButton}
					accessibilityRole='button'
					accessibilityLabel={I18n.t('Remove')}
					testID='new-media-call-clear-selected-peer'>
					<CustomIcon name='close' size={16} color={colors.buttonFontSecondary} />
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	statusWrap: {
		marginRight: 10
	},
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
	selectedTagName: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textMedium
	},
	removeButton: {
		marginLeft: 10,
		padding: 2
	}
});
