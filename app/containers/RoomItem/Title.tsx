import React from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { themes } from '../../lib/constants';
import { ITitleProps } from './interfaces';

const Title = React.memo(({ name, theme, hideUnreadStatus, alert }: ITitleProps) => (
	<Text
		style={[styles.title, alert && !hideUnreadStatus && styles.alert, { color: themes[theme].titleText }]}
		ellipsizeMode='tail'
		numberOfLines={1}>
		{name}
	</Text>
));

export default Title;
