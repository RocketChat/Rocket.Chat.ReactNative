import React from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { ITitleProps } from './interfaces';
import { useTheme } from '../../theme';

const Title = React.memo(({ name, hideUnreadStatus, alert }: ITitleProps) => {
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
