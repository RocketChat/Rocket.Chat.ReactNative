import { memo } from 'react';
import { View } from 'react-native';
import { PlainText } from '~/containers/PlainText';

import i18n from '~/i18n';
import { useTheme } from '~/theme';
import styles from '../styles';

const SectionHeader = ({ header }: { header: string }) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceRoom }]}>
			<PlainText style={[styles.groupTitle, { color: colors.fontHint }]}>{i18n.t(header)}</PlainText>
		</View>
	);
};

export default memo(SectionHeader);
