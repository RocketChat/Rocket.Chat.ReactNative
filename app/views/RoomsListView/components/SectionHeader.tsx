import { memo } from 'react';
import { Text, View } from 'react-native';

import i18n from '~/i18n';
import { useTheme } from '~/theme';
import styles from '../styles';

const SectionHeader = ({ header, title }: { header: string; title?: string }) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceRoom }]}>
			<Text style={[styles.groupTitle, { color: colors.fontHint }]}>{title ?? i18n.t(header)}</Text>
		</View>
	);
};

export default memo(SectionHeader);
