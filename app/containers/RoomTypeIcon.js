import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
	type: {
		marginRight: 5,
		marginTop: 3
	}
});

const RoomTypeIcon = ({ type, size }) => {
	const icon = {
		c: 'pound',
		p: 'lock',
		l: 'account',
		d: 'at'
	}[type];
	return <Icon name={icon} size={size} style={styles.type} />;
};

RoomTypeIcon.propTypes = {
	type: PropTypes.string.isRequired,
	size: PropTypes.number
};

RoomTypeIcon.defaultProps = {
	size: 15
};

export default RoomTypeIcon;
