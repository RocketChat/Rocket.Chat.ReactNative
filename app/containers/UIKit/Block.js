import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
	margin: {
		margin: 16
	}
});

export const Block = ({ children, flexDirection }) => (
	<View style={[styles.margin, flexDirection && { flexDirection }]}>{children}</View>
);
Block.propTypes = {
	children: PropTypes.node,
	flexDirection: PropTypes.string
};
