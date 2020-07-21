import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { CustomIcon } from '../lib/Icons';
import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	icon: {
		width: 22,
		height: 22,
		marginHorizontal: 15
	}
});

const Check = React.memo(({ theme, style }) => <CustomIcon style={[styles.icon, style]} color={themes[theme].tintColor} size={22} name='check' />);

Check.propTypes = {
	style: PropTypes.object,
	theme: PropTypes.string
};

export default Check;
