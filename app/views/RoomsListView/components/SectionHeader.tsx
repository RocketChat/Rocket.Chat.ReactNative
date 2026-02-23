import { memo } from 'react';
import { Text, View } from 'react-native';

import i18n from '../../../i18n';
import { useTheme } from '../../../theme';
import styles from '../styles';

const SectionHeader = ({ header }: { header: string }) => {
	'use memo';

	const { colors } = useTheme();
	return (
		<View style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceRoom }]}>
			<Text style={[styles.groupTitle, { color: colors.fontHint }]}>{i18n.t(header)}</Text>
		</View>
	);
};

export default memo(SectionHeader);
