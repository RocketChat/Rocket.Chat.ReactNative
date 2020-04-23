import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { STATUS_COLORS, themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import Status from '../../../containers/Status/Status';
import { isAndroid } from '../../../utils/deviceInfo';

const ICON_SIZE = 18;

const styles = StyleSheet.create({
	type: {
		width: ICON_SIZE,
		height: ICON_SIZE,
		marginRight: 4,
		marginLeft: -4
	},
	status: {
		marginRight: 8
	}
});

const Icon = React.memo(({
	roomUserId, type, status, theme
}) => {
	if (type === 'd' && roomUserId) {
		return <Status size={10} style={styles.status} status={status} />;
	}

	let colorStyle = {};
	if (type === 'd' && roomUserId) {
		colorStyle = { color: STATUS_COLORS[status] };
	} else {
		colorStyle = { color: isAndroid && theme === 'light' ? themes[theme].buttonText : themes[theme].auxiliaryText };
	}

	let icon;
	if (type === 'discussion') {
		icon = 'chat';
	} else if (type === 'thread') {
		icon = 'thread';
	} else if (type === 'c') {
		icon = 'hashtag';
	} else if (type === 'l') {
		icon = 'livechat';
	} else if (type === 'd') {
		icon = 'team';
	} else {
		icon = 'lock';
	}
	return (
		<CustomIcon
			name={icon}
			size={ICON_SIZE * 1}
			style={[
				styles.type,
				{
					width: ICON_SIZE * 1,
					height: ICON_SIZE * 1
				},
				colorStyle
			]}
		/>
	);
});

Icon.propTypes = {
	roomUserId: PropTypes.string,
	type: PropTypes.string,
	status: PropTypes.string,
	theme: PropTypes.string
};
export default Icon;
