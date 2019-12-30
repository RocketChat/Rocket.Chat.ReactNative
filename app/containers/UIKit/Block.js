import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

export const Block = ({ children, flexDirection }) => (
	<View style={flexDirection && { flexDirection }}>{children}</View>
);
Block.propTypes = {
	children: PropTypes.node,
	flexDirection: PropTypes.string
};
