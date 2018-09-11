import React from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
	separator: {
		marginTop: 30,
		marginLeft: 10,
		fontSize: 20,
		fontWeight: '300'
	}
});

const Separator = ({ title, style }) => <Text style={[styles.separator, style]}>{title}</Text>;

Separator.propTypes = {
	title: PropTypes.string.isRequired,
	style: PropTypes.object
};

export default Separator;
