import React from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';

interface ITitle {
	name: string;
	theme: TSupportedThemes;
	hideUnreadStatus: boolean;
	alert: boolean;
}

const Title = React.memo(({ name, theme, hideUnreadStatus, alert }: ITitle) => (
	<Text
		style={[styles.title, alert && !hideUnreadStatus && styles.alert, { color: themes[theme].titleText }]}
		ellipsizeMode='tail'
		numberOfLines={1}>
		{name}
	</Text>
));

export default Title;
