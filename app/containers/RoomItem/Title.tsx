import React from 'react';
import { Text, View } from 'react-native';

import styles from './styles';
import { type ITitleProps } from './interfaces';
import { useTheme } from '../../theme';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const Title = React.memo(({ name, hideUnreadStatus, alert }: ITitleProps) => {
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	return (
		<View style={styles.title}>
			<Text
				style={[styles.titleText, alert && !hideUnreadStatus && styles.alert, { color: colors.fontTitlesLabels, fontSize: scaleFontSize(17) }]}
				ellipsizeMode='tail'
				numberOfLines={1}
				adjustsFontSizeToFit={false}>
				{name}
			</Text>
		</View>
	);
});

export default Title;
