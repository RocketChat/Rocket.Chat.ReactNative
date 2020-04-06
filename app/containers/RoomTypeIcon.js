import React from 'react';
import { Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { CustomIcon } from '../lib/Icons';
import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	style: {
		marginRight: 7,
		marginTop: 3
	},
	discussion: {
		marginRight: 6
	}
});

const RoomTypeIcon = React.memo(({
	type, size, isGroupChat, style, theme
}) => {
	if (!type) {
		return null;
	}

	const color = themes[theme].auxiliaryText;

	if (type === 'discussion') {
		// FIXME: These are temporary only. We should have all room icons on <Customicon />, but our design team is still working on this.
		return <CustomIcon name='chat' size={13} style={[styles.style, styles.iconColor, styles.discussion, { color }]} />;
	}

	if (type === 'c') {
		return <Image source={{ uri: 'hashtag' }} style={[styles.style, style, { width: size, height: size, tintColor: color }]} />;
	} if (type === 'd') {
		if (isGroupChat) {
			return <CustomIcon name='team' size={13} style={[styles.style, styles.discussion, { color }]} />;
		}
		return <CustomIcon name='at' size={13} style={[styles.style, styles.discussion, { color }]} />;
	} if (type === 'l') {
		return <CustomIcon name='livechat' size={13} style={[styles.style, styles.discussion, { color }]} />;
	}
	return <Image source={{ uri: 'lock' }} style={[styles.style, style, { width: size, height: size, tintColor: color }]} />;
});

RoomTypeIcon.propTypes = {
	theme: PropTypes.string,
	type: PropTypes.string,
	isGroupChat: PropTypes.bool,
	size: PropTypes.number,
	style: PropTypes.object
};

RoomTypeIcon.defaultProps = {
	size: 10
};

export default RoomTypeIcon;
