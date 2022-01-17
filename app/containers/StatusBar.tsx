import React from 'react';
import { StatusBar as StatusBarRN } from 'react-native';

import { themes } from '../constants/colors';
import { withTheme } from '../theme';

interface IStatusBar {
	theme?: string;
	barStyle?: any;
	backgroundColor?: string;
}

const StatusBar = React.memo(({ theme, barStyle, backgroundColor }: IStatusBar) => {
	if (!barStyle) {
		barStyle = 'light-content';
		if (theme === 'light') {
			barStyle = 'dark-content';
		}
	}
	return <StatusBarRN backgroundColor={backgroundColor ?? themes[theme!].headerBackground} barStyle={barStyle} animated />;
});

export default withTheme(StatusBar);
