import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
	quoteSign: {
		borderWidth: 2,
		borderRadius: 4,
		height: '100%',
		marginRight: 5
	}
});

const QuoteMark = ({ color }) => <View style={[styles.quoteSign, { borderColor: color || '#a0a0a0' }]} />;

QuoteMark.propTypes = {
	color: PropTypes.string
};

export default QuoteMark;
