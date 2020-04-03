import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import { withTheme } from '../theme';

const VisitorNavigationView = ({ theme }) => {
	console.log(theme);
	return <View style={{ flex: 1, backgroundColor: 'red' }} />;
};
VisitorNavigationView.propTypes = {
	theme: PropTypes.string
};

export default withTheme(VisitorNavigationView);
