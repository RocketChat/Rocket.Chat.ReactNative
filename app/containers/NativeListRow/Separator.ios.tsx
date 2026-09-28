import { StyleSheet, View } from 'react-native';

import { useTheme } from '~/theme';
import { AVATAR_SIZE, CONTENT_SPACING, ROW_MARGIN_HORIZONTAL, ROW_PADDING_HORIZONTAL } from './constants';

const styles = StyleSheet.create({
	card: {
		marginHorizontal: ROW_MARGIN_HORIZONTAL
	},
	line: {
		height: StyleSheet.hairlineWidth
	}
});

const Line = ({ inset }: { inset: number }) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.card, { backgroundColor: colors.surfaceLight }]}>
			<View style={[styles.line, { marginLeft: inset, backgroundColor: colors.strokeLight }]} />
		</View>
	);
};

export const PlainSeparator = () => <Line inset={ROW_PADDING_HORIZONTAL} />;

const Separator = () => <Line inset={ROW_PADDING_HORIZONTAL + AVATAR_SIZE + CONTENT_SPACING} />;

export default Separator;
