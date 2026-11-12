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
			style={[
				styles.date,
				{
					color: colors.fontDefault
				},
				isUnread && [
					styles.updateAlert,
					{
						color: colors.fontInfo
					}
				]
			]}
			ellipsizeMode='tail'
			numberOfLines={1}>
			{capitalize(date)}
		</Text>
	);
});

export default UpdatedAt;
