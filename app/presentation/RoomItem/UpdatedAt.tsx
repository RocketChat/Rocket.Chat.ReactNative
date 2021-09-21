import React from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';
import { capitalize } from '../../utils/room';

interface IUpdatedAt {
	date: string;
	theme: string;
	hideUnreadStatus: boolean;
	alert: boolean;
}

const UpdatedAt = React.memo(({ date, theme, hideUnreadStatus, alert }: IUpdatedAt) => {
	if (!date) {
		return null;
	}
	return (
		<Text
			style={[
				styles.date,
				{
					color: themes[theme].auxiliaryText
				},
				alert &&
					!hideUnreadStatus && [
						styles.updateAlert,
						{
							color: themes[theme].tintColor
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
