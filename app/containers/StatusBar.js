import React from 'react';
import { StatusBar as StatusBarRN } from 'react-native';
import PropTypes from 'prop-types';

import { isIOS } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';

const StatusBar = React.memo(({ theme }) => {
	// TODO: need this?
	// if (light) {
	// 	return <StatusBarRN backgroundColor={COLOR_WHITE} barStyle='light-content' animated />;
	// }
	let barStyle = 'light-content';
	if (theme === 'light' && isIOS) {
		barStyle = 'dark-content';
	}
	return <StatusBarRN backgroundColor={themes[theme].headerBackground} barStyle={barStyle} animated />;
});

StatusBar.propTypes = {
	theme: PropTypes.string
};

export default withTheme(StatusBar);
