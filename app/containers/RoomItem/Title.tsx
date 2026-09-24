import { memo } from 'react';
import { PlainText } from 'react-native-plain-text';

import styles from './styles';
import { type ITitleProps } from './interfaces';
import { useTheme } from '~/theme';

const Title = memo(({ name, hideUnreadStatus, alert }: ITitleProps) => {
	const { colors } = useTheme();
	return (
		<PlainText
			style={[styles.title, alert && !hideUnreadStatus && styles.alert, { color: colors.fontTitlesLabels }]}
			ellipsizeMode='tail'
			numberOfLines={1}>
			{name}
		</PlainText>
	);
});

export default Title;
