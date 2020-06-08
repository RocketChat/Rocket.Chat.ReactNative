import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { CustomIcon } from '../lib/Icons';
import { STATUS_COLORS, themes } from '../constants/colors';

const styles = StyleSheet.create({
	icon: {
		marginTop: 3,
		marginRight: 4
	}
});

const RoomTypeIcon = React.memo(({
	type, size, isGroupChat, status, style, theme
}) => {
	if (!type) {
		return null;
	}

	const color = themes[theme].auxiliaryText;

	let icon = 'lock';
	if (type === 'discussion') {
		icon = 'chat';
	} else if (type === 'c') {
		icon = 'hash';
	} else if (type === 'd') {
		if (isGroupChat) {
			icon = 'team';
		} else {
			icon = 'at';
		}
	} else if (type === 'l') {
		icon = 'livechat';
	}

	return (
		<CustomIcon
			name={icon}
			size={size}
			style={[
				type === 'l' ? { color: STATUS_COLORS[status] } : { color },
				styles.icon,
				style
			]}
		/>
	);
});

RoomTypeIcon.propTypes = {
	theme: PropTypes.string,
	type: PropTypes.string,
	isGroupChat: PropTypes.bool,
	status: PropTypes.string,
	size: PropTypes.number,
	style: PropTypes.object
};

RoomTypeIcon.defaultProps = {
	size: 16
};

export default RoomTypeIcon;
