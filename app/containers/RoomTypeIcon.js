import React from 'react';
import { Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { CustomIcon } from '../lib/Icons';
import { COLOR_TEXT_DESCRIPTION } from '../constants/colors';

const styles = StyleSheet.create({
	style: {
		marginRight: 7,
		marginTop: 3,
		tintColor: COLOR_TEXT_DESCRIPTION,
		color: COLOR_TEXT_DESCRIPTION
	},
	discussion: {
		marginRight: 6
	}
});

const RoomTypeIcon = React.memo(({ type, size, style }) => {
	if (!type) {
		return null;
	}

	if (type === 'discussion') {
		// FIXME: These are temporary only. We should have all room icons on <Customicon />, but our design team is still working on this.
		return <CustomIcon name='chat' size={13} style={[styles.style, styles.discussion]} />;
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
