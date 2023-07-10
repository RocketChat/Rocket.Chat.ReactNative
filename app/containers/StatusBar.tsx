import React, { useEffect } from 'react';
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

	useEffect(() => {
		if (!barStyle) {
			barStyle = 'light-content';
			if (theme === 'light') {
				barStyle = 'dark-content';
			}
		}
		StatusBarRN.setBackgroundColor(backgroundColor ?? themes[theme].headerBackground);
		StatusBarRN.setBarStyle(barStyle, true);
	}, [theme, barStyle, backgroundColor]);

	return <StatusBarRN />;
});

export default StatusBar;
