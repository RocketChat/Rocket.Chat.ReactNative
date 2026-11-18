import { memo } from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { capitalize } from '~/lib/methods/helpers/room';
import { type IUpdatedAtProps } from './interfaces';
import { useTheme } from '~/theme';

const UpdatedAt = memo(({ date, isUnread }: IUpdatedAtProps) => {
	const { colors } = useTheme();

	if (!date) {
		return null;
	}
	return (
		<Text
			style={[styles.date, isUnread ? [styles.alert, { color: colors.fontInfo }] : { color: colors.fontDefault }]}
			ellipsizeMode='tail'
			numberOfLines={1}>
			{capitalize(date)}
		</Text>
	);
});

export default UpdatedAt;
