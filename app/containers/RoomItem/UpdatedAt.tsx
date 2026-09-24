import { memo } from 'react';
import { PlainText } from 'react-native-plain-text';

import styles from './styles';
import { capitalize } from '~/lib/methods/helpers/room';
import { type IUpdatedAtProps } from './interfaces';
import { useTheme } from '~/theme';

const UpdatedAt = memo(({ date, hideUnreadStatus, alert }: IUpdatedAtProps) => {
	const { colors } = useTheme();

	if (!date) {
		return null;
	}
	return (
		<PlainText
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
		</PlainText>
	);
});

export default UpdatedAt;
