import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { COLOR_SEPARATOR } from '../constants/colors';

const styles = StyleSheet.create({
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR
	}
});


const Separator = React.memo(({ style }) => <View style={[styles.separator, style]} />);

Separator.propTypes = {
	style: PropTypes.object
};

export default Separator;
