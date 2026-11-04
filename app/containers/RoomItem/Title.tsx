import { memo } from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { type ITitleProps } from './interfaces';
import { useTheme } from '~/theme';

const Title = memo(({ name, hideUnreadStatus, alert }: ITitleProps) => {
	const { colors } = useTheme();
	const isUnread = alert && !hideUnreadStatus;
	return (
		<Text
			style={[styles.title, isUnread ? [styles.alert, { color: colors.fontTitlesLabels }] : { color: colors.fontDefault }]}
			ellipsizeMode='tail'
			numberOfLines={1}>
			{name}
		</Text>
	);
});

export default Title;
