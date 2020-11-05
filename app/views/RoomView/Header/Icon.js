import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { STATUS_COLORS, themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import Status from '../../../containers/Status/Status';

const ICON_SIZE = 15;

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
	roomUserId, type, status, theme, tmid
}) => {
	if ((type === 'd' || tmid) && roomUserId) {
		return <Status size={10} style={styles.status} status={status} />;
	}

	let colorStyle = {};
	if (type === 'l') {
		colorStyle = { color: STATUS_COLORS[status] };
	} else {
		colorStyle = { color: themes[theme].auxiliaryText };
	}

	let icon;
	if (type === 'discussion') {
		icon = 'discussions';
	} else if (type === 'c') {
		icon = 'channel-public';
	} else if (type === 'l') {
		icon = 'omnichannel';
	} else if (type === 'd') {
		icon = 'team';
	} else {
		icon = 'channel-private';
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
	theme: PropTypes.string,
	tmid: PropTypes.string
};
export default Icon;
