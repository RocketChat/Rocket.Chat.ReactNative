import React from 'react';
import { Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
	style: {
		marginRight: 7,
		marginTop: 3
	}
});

const RoomTypeIcon = ({ type, size, style }) => {
	if (!type) {
		return null;
	}

	if (type === 'c') {
		return <Image source={{ uri: 'subscription_hashtag' }} style={[styles.style, style, { width: size, height: size }]} />;
	}
	return <Image source={{ uri: 'subscription_lock' }} style={[styles.style, style, { width: size, height: size }]} />;
};

RoomTypeIcon.propTypes = {
	type: PropTypes.string,
	size: PropTypes.number,
	style: PropTypes.object
};

RoomTypeIcon.defaultProps = {
	size: 10
};

export default RoomTypeIcon;
