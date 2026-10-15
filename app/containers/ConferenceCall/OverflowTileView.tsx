import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import Avatar from '~/containers/Avatar';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IOverflowTileView {
	hidden: { id: string; name: string }[];
}

const FACE_SIZE = 36;
const FACES_SHOWN = 2;

const styles = StyleSheet.create({
	tile: {
		flex: 1,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8
	},
	faces: {
		flexDirection: 'row',
		gap: 4
	},
	text: {
		...sharedStyles.textBold,
		fontSize: 12,
		lineHeight: 16
	}
});

const OverflowTileView = ({ hidden }: IOverflowTileView): ReactElement => {
	const { colors } = useTheme();
	const unseen = hidden.length - FACES_SHOWN;

	return (
		<View style={[styles.tile, { backgroundColor: colors.surfaceNeutral }]} testID='overflow-tile'>
			<View style={styles.faces}>
				{hidden.slice(0, FACES_SHOWN).map(({ id, name }) => (
					<Avatar key={id} avatar={`/avatar/uid/${id}`} text={name} size={FACE_SIZE} borderRadius={4} />
				))}
			</View>
			{unseen > 0 ? (
				<Text style={[styles.text, { color: colors.fontSecondaryInfo }]}>{I18n.t('and_N_more', { count: unseen })}</Text>
			) : null}
		</View>
	);
};

export default OverflowTileView;
