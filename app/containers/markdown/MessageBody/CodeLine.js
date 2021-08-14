import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

const CodeLine = ({ value }) => (
	<Text>{value.type === 'PLAIN_TEXT' && value.value}</Text>
);

CodeLine.propTypes = {
	value: PropTypes.object
};

export default CodeLine;
