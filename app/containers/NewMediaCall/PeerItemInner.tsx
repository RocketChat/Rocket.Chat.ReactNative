import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { CustomIcon } from '../CustomIcon';
import Avatar from '../Avatar';
import Status from '../Status';
import sharedStyles from '../../views/Styles';

export const PeerItemInner = ({ item }: { item: TPeerItem }) => {
	const { colors } = useTheme();

	const isSip = item.type === 'sip';

	return (
		<>
			<View style={styles.icon}>
				{isSip ? (
					<CustomIcon name='phone-in' size={20} color={colors.fontSecondaryInfo} />
				) : (
					<Avatar text={item.username || item.label} size={28} />
				)}
			</View>
			<View style={styles.nameContainer}>
				{!isSip ? <Status id={item.value} size={20} /> : null}
				<Text style={[styles.name, { color: colors.fontDefault }]} numberOfLines={1}>
					{item.label}
				</Text>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	icon: {
		width: 28,
		alignItems: 'center'
	},
	nameContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4
	},
	name: {
		flexShrink: 1,
		fontSize: 18,
		lineHeight: 26,
		...sharedStyles.textMedium
	}
});
