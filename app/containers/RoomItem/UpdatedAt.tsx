import React from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { capitalize } from '../../lib/methods/helpers/room';
import { type IUpdatedAtProps } from './interfaces';
import { useTheme } from '../../theme';

const UpdatedAt = React.memo(({ date, hideUnreadStatus, alert }: IUpdatedAtProps) => {
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
				alert &&
					!hideUnreadStatus && [
						styles.updateAlert,
						{
							color: colors.badgeBackgroundLevel2
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
