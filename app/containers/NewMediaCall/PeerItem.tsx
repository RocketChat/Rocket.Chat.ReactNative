import { Pressable, View, Text, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { CustomIcon } from '../CustomIcon';
import Avatar from '../Avatar';
import Status from '../Status';
import sharedStyles from '../../views/Styles';

export const PeerItem = ({ item, onSelectOption }: { item: TPeerItem; onSelectOption: (item: TPeerItem) => void }) => {
	const { colors } = useTheme();

	const isSip = item.type === 'sip';

	return (
		<Pressable style={styles.row} onPress={() => onSelectOption(item)} testID={`new-media-call-option-${item.value}`}>
			{isSip ? (
				<CustomIcon name='phone-in' size={20} color={colors.fontSecondaryInfo} style={{ marginHorizontal: 10 }} />
			) : (
				<Avatar text={item.username || item.label} size={28} style={{ marginHorizontal: 10, borderRadius: 4 }} />
			)}
			{!isSip ? (
				<View style={styles.statusWrap}>
					<Status id={item.value} status={item.status || 'offline'} size={20} />
				</View>
			) : null}
			<Text style={[styles.rowName, { color: colors.fontDefault }]} numberOfLines={1}>
				{item.label}
			</Text>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	row: {
		minHeight: 54,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 6
	},
	rowName: {
		flex: 1,
		fontSize: 18,
		lineHeight: 26,
		...sharedStyles.textMedium
	},
	statusWrap: {
		marginRight: 10
	}
});
