import { View, Text } from 'react-native';

import { useTheme } from '../../../theme';
import styles from '../styles';
import i18n from '../../../i18n';

export const SectionHeader = ({ header }: { header: string }) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceRoom }]}>
			<Text style={[styles.groupTitle, { color: colors.fontHint }]}>{i18n.t(header)}</Text>
		</View>
	);
};
