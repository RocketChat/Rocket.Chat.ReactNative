import { Text } from 'react-native';
import { memo } from 'react';

import styles from './styles';
import type { ITitleProps } from './interfaces';
import { useTheme } from '../../theme';

const Title = memo(({ name, hideUnreadStatus, alert }: ITitleProps) => {
	const { colors } = useTheme();
	return (
		<Text
			style={[styles.title, alert && !hideUnreadStatus && styles.alert, { color: colors.fontTitlesLabels }]}
			ellipsizeMode='tail'
			numberOfLines={1}>
			{name}
		</Text>
	);
});

export default Title;
