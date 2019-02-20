import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';

const UpdatedAt = React.memo(({ date }) => {
	if (date) {
		return <Text style={[styles.date, alert && styles.updateAlert]} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text>;
	}
	return null;
});
UpdatedAt.propTypes = {
	date: PropTypes.string
};

export default UpdatedAt;
