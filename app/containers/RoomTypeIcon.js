import React from 'react';
import { Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { CustomIcon } from '../lib/Icons';

const styles = StyleSheet.create({
	style: {
		marginRight: 7,
		marginTop: 3,
		tintColor: '#9EA2A8',
		color: '#9EA2A8'
	}
});

const RoomTypeIcon = React.memo(({ type, size, style }) => {
	if (!type) {
		return null;
	}

	if (type === 'thread') {
		return <CustomIcon name='thread' size={13} style={[styles.style, { marginRight: 6 }]} />;
	}

	if (type === 'c') {
		return <Image source={{ uri: 'hashtag' }} style={[styles.style, style, { width: size, height: size }]} />;
	}
	return <Image source={{ uri: 'lock' }} style={[styles.style, style, { width: size, height: size }]} />;
});

RoomTypeIcon.propTypes = {
	type: PropTypes.string,
	size: PropTypes.number,
	style: PropTypes.object
};

RoomTypeIcon.defaultProps = {
	size: 10
};

export default RoomTypeIcon;
