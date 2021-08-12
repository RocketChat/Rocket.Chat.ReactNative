import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

const Plain = ({ value }) => (
	<Text accessibilityLabel={value}>
		{value}
	</Text>
);

Plain.propTypes = {
	value: PropTypes.string
};

export default Plain;
