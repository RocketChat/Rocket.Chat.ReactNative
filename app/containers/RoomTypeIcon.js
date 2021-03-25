import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { CustomIcon } from '../lib/Icons';
import { STATUS_COLORS, themes } from '../constants/colors';

const styles = StyleSheet.create({
	icon: {
		marginRight: 2
	}
});

const RoomTypeIcon = React.memo(({
	type, size, isGroupChat, status, style, theme, teamMain
}) => {
	if (!type) {
		return null;
	}

	const color = themes[theme].titleText;

	let icon = 'channel-private';
	if (teamMain) {
		icon = `teams${ type === 'p' ? '-private' : '' }`;
	} else if (type === 'discussion') {
		icon = 'discussions';
	} else if (type === 'c') {
		icon = 'channel-public';
	} else if (type === 'd') {
		if (isGroupChat) {
			icon = 'message';
		} else {
			icon = 'mention';
		}
	} else if (type === 'l') {
		icon = 'omnichannel';
	}

	return (
		<CustomIcon
			name={icon}
			size={size}
			style={[
				type === 'l' && status ? { color: STATUS_COLORS[status] } : { color },
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
	teamMain: PropTypes.bool,
	status: PropTypes.string,
	size: PropTypes.number,
	style: PropTypes.object
};

RoomTypeIcon.defaultProps = {
	size: 16
};

export default RoomTypeIcon;
