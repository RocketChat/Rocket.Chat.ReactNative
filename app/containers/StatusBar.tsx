import React, { useEffect } from 'react';
import { StatusBar as StatusBarRN } from 'react-native';

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
	const { theme, colors } = useTheme();

	useEffect(() => {
		if (!barStyle) {
			barStyle = 'light-content';
			if (theme === 'light') {
				barStyle = 'dark-content';
			}
		}
		StatusBarRN.setBackgroundColor(backgroundColor ?? colors.headerBackground);
		StatusBarRN.setBarStyle(barStyle, true);
	}, [theme, barStyle, backgroundColor]);

	return <StatusBarRN />;
});

export default StatusBar;
