import React from 'react';
import { StatusBar as StatusBarRN } from 'react-native';

import { themes } from '../lib/constants';
import { useTheme } from '../theme';

const supportedStyles = {
	'light-content': 'light-content',
	'dark-content': 'dark-content'
};

interface IStatusBar {
	barStyle?: keyof typeof supportedStyles;
	backgroundColor?: string;
}

const StatusBar = React.memo(({ barStyle, backgroundColor }: IStatusBar) => {
	const { theme } = useTheme();
	if (!barStyle) {
		barStyle = 'light-content';
		if (theme === 'light') {
			barStyle = 'dark-content';
		}
	}
	return <StatusBarRN backgroundColor={backgroundColor ?? themes[theme].headerBackground} barStyle={barStyle} animated />;
});

export default StatusBar;
