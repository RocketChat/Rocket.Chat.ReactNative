import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { CustomIcon } from '../lib/Icons';
import { STATUS_COLORS, themes } from '../constants/colors';
import Status from './Status/Status';
import { withTheme } from '../theme';

const styles = StyleSheet.create({
	icon: {
		marginRight: 4
	}
});

const RoomTypeIcon = React.memo(({
	type, size, isGroupChat, status, style, theme, teamMain
}) => {
	if (!type) {
		return null;
	}

	const color = themes[theme].titleText;
	const iconStyle = [
		styles.icon,
		{ color },
		style
	];

	if (type === 'd' && !isGroupChat) {
		return <Status style={[iconStyle, { color: STATUS_COLORS[status] ?? STATUS_COLORS.offline }]} size={size} status={status} />;
	}

	// TODO: move this to a separate function
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
			style={iconStyle}
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

export default withTheme(RoomTypeIcon);
