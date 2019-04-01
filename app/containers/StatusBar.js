import React from 'react';
import { StatusBar as StatusBarRN } from 'react-native';
import PropTypes from 'prop-types';

import { isIOS } from '../utils/deviceInfo';
import { HEADER_BACKGROUND, COLOR_WHITE } from '../constants/colors';

const HEADER_BAR_STYLE = isIOS ? 'dark-content' : 'light-content';

const StatusBar = React.memo(({ light }) => {
	if (light) {
		return <StatusBarRN backgroundColor={COLOR_WHITE} barStyle='dark-content' animated />;
	}
	return <StatusBarRN backgroundColor={HEADER_BACKGROUND} barStyle={HEADER_BAR_STYLE} animated />;
});

StatusBar.propTypes = {
	light: PropTypes.bool
};

StatusBar.defaultProps = {
	light: false
};

export default StatusBar;
